const dropArea = document.getElementById('drop-area');
const log      = document.getElementById('log');

// Highlight on dragenter / dragover, and allow drop
;['dragenter', 'dragover'].forEach(evt =>
  dropArea.addEventListener(evt, e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dropArea.classList.add('highlight');
  })
);

// Remove highlight on dragleave / dragend
;['dragleave', 'dragend', 'mouseout'].forEach(evt =>
  dropArea.addEventListener(evt, () => {
    dropArea.classList.remove('highlight');
  })
);


// Handle the drop
dropArea.addEventListener('drop', async e => {
  e.preventDefault();
  dropArea.classList.remove('highlight');

  // We expect the first dropped item to be a directory
  const file = e.dataTransfer.files[0];
  const info = {
    name:     file.name,
    type:     file.webkitRelativePath,
    size:     file.size,
    lastModified: file.lastModified,
    lastModifiedDate: file.lastModifiedDate,
  };

  console.log();
  if (!file || !file.path) {
    log.textContent = '❌ No folder detected in drop!\n' + JSON.stringify(info, null, 2);
    return;
  }

  const fs = require('fs');
  const stat = fs.statSync(file.path);
  if (!stat.isDirectory()) {
    log.textContent = '❌ Please drop a folder, not a file.';
    return;
  }

  log.textContent = `🔄 Processing folder:\n${file.path}\n\n`;
  try {
    const messages = await window.electronAPI.processDirectory(file.path);
    log.textContent += messages.join('\n');
  } catch (err) {
    log.textContent += `❌ Unexpected error: ${err}`;
  }
});

document.getElementById('chooseBtn').addEventListener('click', async () => {
  const folder = await window.electronAPI.chooseDirectory();
  if (!folder) return;
  log.textContent = `🔄 Processing: ${folder}\n`;
  const msgs = await window.electronAPI.processDirectory(folder);
  log.textContent += msgs.join('\n');
});