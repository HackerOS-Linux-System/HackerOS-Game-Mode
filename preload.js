const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onUpdateStats: (callback) => ipcRenderer.on('update-stats', callback)
});
