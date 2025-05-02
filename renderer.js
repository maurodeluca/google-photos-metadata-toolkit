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

// Handle dropped files
dropArea.addEventListener('drop', async e => {
  e.preventDefault();
  dropArea.classList.remove('highlight');

  const droppedFiles = [...e.dataTransfer.files];

  if (droppedFiles.length === 0) {
    log.textContent = '❌ No files dropped!';
    return;
  }

  const files = [];

  for (const file of droppedFiles) {
    try {
      const path = await window.electronAPI.getPathForFile(file);
      files.push({ file, path });
    } catch (err) {
      console.warn('Skipping item:', err);
    }
  }

  if (files.length === 0) {
    log.textContent = '⚠️ All dropped items were folders or inaccessible. Please drop files only.';
    return;
  }

  log.textContent = `🔄 Processing ${files.length} file(s)...\n\n`;

  try {
    const results = await Promise.all(
      files.map(({ path }) => window.electronAPI.processFile(path))
    );
    results.forEach(res => (log.textContent += `${res}\n`));
  } catch (err) {
    log.textContent += `❌ Error: ${err.message}`;
  }
});