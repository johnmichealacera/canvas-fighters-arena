const { contextBridge } = require("electron");

/**
 * Minimal preload: no privileged APIs exposed by default.
 * Extend with contextBridge.exposeInMainWorld if you add IPC later.
 */
contextBridge.exposeInMainWorld("electronApp", {
  isElectron: true,
  platform: process.platform,
});
