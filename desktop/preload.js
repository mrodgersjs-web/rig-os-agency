const { contextBridge, ipcRenderer } = require("electron");

// Expose safe APIs to the renderer
contextBridge.exposeInMainWorld("rigDesktop", {
  getVersion: () => ipcRenderer.invoke("get-app-version"),
  getAppPath: () => ipcRenderer.invoke("get-app-path"),
  onCommandPalette: (callback) => ipcRenderer.on("open-command-palette", callback),
});