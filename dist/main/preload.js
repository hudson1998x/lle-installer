"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("lle", {
    checkDotnet: () => electron_1.ipcRenderer.invoke("check-dotnet"),
    installDotnet: () => electron_1.ipcRenderer.invoke("install-dotnet"),
    getReleases: () => electron_1.ipcRenderer.invoke("get-releases"),
    installLle: (tag, zipballUrl) => electron_1.ipcRenderer.invoke("install-lle", tag, zipballUrl),
    startServer: (projectPath) => electron_1.ipcRenderer.invoke("start-server", projectPath),
    stopServer: () => electron_1.ipcRenderer.invoke("stop-server"),
    switchVersion: (tag, zipballUrl) => electron_1.ipcRenderer.invoke("switch-version", tag, zipballUrl),
    uninstall: () => electron_1.ipcRenderer.invoke("uninstall"),
    getInstallPath: () => electron_1.ipcRenderer.invoke("get-install-path"),
    getServerUrl: () => electron_1.ipcRenderer.invoke("get-server-url"),
    isServerRunning: () => electron_1.ipcRenderer.invoke("is-server-running"),
    openUrl: (url) => electron_1.ipcRenderer.invoke("open-url", url),
    closeWindow: () => electron_1.ipcRenderer.invoke("close-window"),
    goBack: () => electron_1.ipcRenderer.invoke("go-back"),
    getInitialStatus: () => electron_1.ipcRenderer.invoke("get-initial-status"),
    onDotnetProgress: (callback) => {
        electron_1.ipcRenderer.on("dotnet-progress", (_event, msg) => callback(msg));
    },
    onInstallProgress: (callback) => {
        electron_1.ipcRenderer.on("install-progress", (_event, msg) => callback(msg));
    },
    onServerStatus: (callback) => {
        electron_1.ipcRenderer.on("server-status", (_event, msg) => callback(msg));
    },
    onSwitchProgress: (callback) => {
        electron_1.ipcRenderer.on("switch-progress", (_event, msg) => callback(msg));
    },
    onUninstallProgress: (callback) => {
        electron_1.ipcRenderer.on("uninstall-progress", (_event, msg) => callback(msg));
    },
    onAppReady: (callback) => {
        electron_1.ipcRenderer.on("app-ready", () => callback());
    },
});
//# sourceMappingURL=preload.js.map