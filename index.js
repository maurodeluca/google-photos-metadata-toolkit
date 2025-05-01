const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exiftool } = require('exiftool-vendored');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,   // <-- allows require() & file.path
      contextIsolation: false, // <-- allows window.electronAPI
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('process-directory', async (event, dirPath) => {
  const jsonFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  const messages = [];

  for (const jsonName of jsonFiles) {
    const jsonPath = path.join(dirPath, jsonName);
    const imagePath = jsonPath.replace(/\.json$/, '');

    if (!fs.existsSync(imagePath)) {
      messages.push(`⚠️ Skipped: ${jsonName} (image not found)`);
      continue;
    }

    try {
      const meta = JSON.parse(fs.readFileSync(jsonPath));
      const tags = {
        Title: meta.title,
        Description: meta.description,
        ImageViews: meta.imageViews,
        CreateDate: unixToExif(meta.creationTime?.timestamp),
        DateTimeOriginal: unixToExif(meta.photoTakenTime?.timestamp),
        ModifyDate: meta.photoLastModifiedTime?.timestamp ? unixToExif(meta.photoLastModifiedTime.timestamp) : undefined,
        GPSLatitude: meta.geoData?.latitude,
        GPSLongitude: meta.geoData?.longitude,
        GPSAltitude: meta.geoData?.altitude,
        DeviceType: meta.googlePhotosOrigin?.mobileUpload?.deviceType,
        URL: meta.url
      };

      await exiftool.write(imagePath, tags, ['-overwrite_original']);
      messages.push(`✅ Processed: ${path.basename(imagePath)}`);
    } catch (err) {
      messages.push(`❌ Error: ${jsonName} — ${err.message}`);
    }
  }

  await exiftool.end();
  return messages;
});

function unixToExif(timestamp) {
  if (!timestamp) return undefined;
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, ':');
}


ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return canceled ? null : filePaths[0];
});