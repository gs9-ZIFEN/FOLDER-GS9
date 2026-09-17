const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  getShortcuts: () => ipcRenderer.invoke('get-shortcuts'),
  openShortcut: (path) => ipcRenderer.send('open-shortcut', path),
  deleteShortcut: (path) => ipcRenderer.send('delete-shortcut', path),
  saveLayout: (layoutArray) => ipcRenderer.send('save-layout', layoutArray)
});