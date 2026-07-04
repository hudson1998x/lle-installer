"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIpcHandlers = setupIpcHandlers;
const electron_1 = require("electron");
const dotnet_1 = require("./dotnet");
const installer_1 = require("./installer");
const server_1 = require("./server");
const uninstall_1 = require("./uninstall");
const updater_1 = require("./updater");
let mainWindow = null;
function send(channel, ...args) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, ...args);
    }
}
function setupIpcHandlers(window) {
    mainWindow = window;
    electron_1.ipcMain.handle("check-dotnet", async () => {
        return await (0, dotnet_1.checkDotnet)();
    });
    electron_1.ipcMain.handle("install-dotnet", async () => {
        return await (0, dotnet_1.installDotnet)((msg) => {
            send("dotnet-progress", msg);
        });
    });
    electron_1.ipcMain.handle("get-releases", async () => {
        return await (0, installer_1.getAvailableVersions)();
    });
    electron_1.ipcMain.handle("install-lle", async (_event, tag, zipballUrl) => {
        const projectPath = await (0, installer_1.installLle)(tag, zipballUrl, (msg) => {
            send("install-progress", msg);
        });
        return projectPath;
    });
    electron_1.ipcMain.handle("start-server", async (_event, projectPath) => {
        await (0, server_1.startServer)(projectPath, (msg) => {
            send("server-status", msg);
        });
        const url = (0, server_1.getServerUrl)();
        mainWindow?.loadURL(url);
        return url;
    });
    electron_1.ipcMain.handle("stop-server", async () => {
        (0, server_1.stopServer)();
        return true;
    });
    electron_1.ipcMain.handle("switch-version", async (_event, tag, zipballUrl) => {
        const projectPath = await (0, updater_1.switchVersion)(tag, zipballUrl, (msg) => {
            send("switch-progress", msg);
        });
        return projectPath;
    });
    electron_1.ipcMain.handle("uninstall", async () => {
        await (0, uninstall_1.uninstall)((msg) => {
            send("uninstall-progress", msg);
        });
        return true;
    });
    electron_1.ipcMain.handle("get-install-path", async () => {
        return await (0, installer_1.getInstallPath)();
    });
    electron_1.ipcMain.handle("get-server-url", async () => {
        return (0, server_1.getServerUrl)();
    });
    electron_1.ipcMain.handle("is-server-running", async () => {
        return (0, server_1.isServerRunning)();
    });
    electron_1.ipcMain.handle("open-url", async (_event, url) => {
        await electron_1.shell.openExternal(url);
        return true;
    });
    electron_1.ipcMain.handle("close-window", async () => {
        mainWindow?.close();
        return true;
    });
    electron_1.ipcMain.handle("go-back", async () => {
        (0, server_1.stopServer)();
        const rendererPath = require("path").join(__dirname, "../renderer/index.html");
        mainWindow?.loadFile(rendererPath);
        return true;
    });
}
//# sourceMappingURL=ipc-handlers.js.map