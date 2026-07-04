import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("lle", {
  checkDotnet: () => ipcRenderer.invoke("check-dotnet"),
  installDotnet: () => ipcRenderer.invoke("install-dotnet"),
  getReleases: () => ipcRenderer.invoke("get-releases"),
  installLle: (tag: string, zipballUrl: string) =>
    ipcRenderer.invoke("install-lle", tag, zipballUrl),
  startServer: (projectPath: string) =>
    ipcRenderer.invoke("start-server", projectPath),
  stopServer: () => ipcRenderer.invoke("stop-server"),
  switchVersion: (tag: string, zipballUrl: string) =>
    ipcRenderer.invoke("switch-version", tag, zipballUrl),
  uninstall: () => ipcRenderer.invoke("uninstall"),
  getInstallPath: () => ipcRenderer.invoke("get-install-path"),
  getServerUrl: () => ipcRenderer.invoke("get-server-url"),
  isServerRunning: () => ipcRenderer.invoke("is-server-running"),
  openUrl: (url: string) => ipcRenderer.invoke("open-url", url),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  goBack: () => ipcRenderer.invoke("go-back"),
  getInitialStatus: () => ipcRenderer.invoke("get-initial-status"),

  onDotnetProgress: (callback: (msg: string) => void) => {
    ipcRenderer.on("dotnet-progress", (_event, msg) => callback(msg));
  },
  onInstallProgress: (callback: (msg: string) => void) => {
    ipcRenderer.on("install-progress", (_event, msg) => callback(msg));
  },
  onServerStatus: (callback: (msg: string) => void) => {
    ipcRenderer.on("server-status", (_event, msg) => callback(msg));
  },
  onSwitchProgress: (callback: (msg: string) => void) => {
    ipcRenderer.on("switch-progress", (_event, msg) => callback(msg));
  },
  onUninstallProgress: (callback: (msg: string) => void) => {
    ipcRenderer.on("uninstall-progress", (_event, msg) => callback(msg));
  },
  onAppReady: (callback: () => void) => {
    ipcRenderer.on("app-ready", () => callback());
  },
});
