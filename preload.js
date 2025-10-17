const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onUpdateStats: (callback) => ipcRenderer.on('update-stats', callback),
                                onGetRects: (callback) => ipcRenderer.on('get-rects', callback),
                                onStopRecording: (callback) => ipcRenderer.on('stop-recording', callback),
                                send: (channel) => ipcRenderer.send(channel),
                                desktopCapturer: require('electron').desktopCapturer
});
