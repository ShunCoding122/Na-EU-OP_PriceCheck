const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("workspace", {
  authStatus: () => ipcRenderer.invoke("auth:status"),
  setupPassword: password => ipcRenderer.invoke("auth:setup", password),
  login: password => ipcRenderer.invoke("auth:login", password),
  loadSlot: code => ipcRenderer.invoke("market:load-slot", code),
  navigate: (market, url) => ipcRenderer.invoke("market:navigate", { market, url }),
  capture: market => ipcRenderer.invoke("market:capture", market),
  eurUsd: () => ipcRenderer.invoke("fx:eur-usd"),
  onUnlocked: callback => ipcRenderer.on("workspace:unlocked", callback)
});
