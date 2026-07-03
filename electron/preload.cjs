const { contextBridge, ipcRenderer, shell } = require('electron')
const { dialog } = require('@electron/remote') || {}

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openPDF: (path) => ipcRenderer.invoke('shell:openPDF', path),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
})