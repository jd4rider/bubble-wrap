const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('bubbleStore', {
  load: () => ipcRenderer.invoke('journey:load'),
  save: (state) => ipcRenderer.invoke('journey:save', state),
  reset: () => ipcRenderer.invoke('journey:reset'),
})
