const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPathForFile: (file) => {
    return webUtils.getPathForFile(file);
  },
  processFile: (filePath) => ipcRenderer.invoke('process-file', filePath)
});
