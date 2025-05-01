const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  chooseDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  processDirectory: (dir) => ipcRenderer.invoke('process-directory', dir)
});
