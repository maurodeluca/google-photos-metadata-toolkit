const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs')
const { applyMetadata } = require('./applyMetadata');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('process-file', async (event, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) {
    return `⏭️ Skipped (not an image): ${filePath}`;
  }

  const jsonPath = filePath + ".json";

  if (!fs.existsSync(jsonPath)) {
    return `⚠️ No JSON found for: ${filePath}`;
  }

  try {
    await applyMetadata(filePath, jsonPath);
    return `✅ Metadata applied to: ${filePath}`;
  } catch (err) {
    return `❌ Error processing ${filePath}: ${err.message}`;
  }
});