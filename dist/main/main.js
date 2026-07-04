"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const dotnet_1 = require("./dotnet");
const installer_1 = require("./installer");
const server_1 = require("./server");
const ipc_handlers_1 = require("./ipc-handlers");
let mainWindow = null;
function createWindow() {
    electron_1.Menu.setApplicationMenu(null);
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: "Language Learning Environment",
        icon: path.join(__dirname, "../../build/icon.png"),
        show: false,
    });
    const rendererPath = path.join(__dirname, "../renderer/index.html");
    mainWindow.loadFile(rendererPath);
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    mainWindow.on("closed", () => {
        if ((0, server_1.isServerRunning)()) {
            (0, server_1.stopServer)();
        }
        mainWindow = null;
    });
}
function sendToRenderer(channel, ...args) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, ...args);
    }
}
electron_1.app.whenReady().then(async () => {
    createWindow();
    (0, ipc_handlers_1.setupIpcHandlers)(mainWindow);
    electron_1.ipcMain.on("cancel-dotnet-install", () => {
        electron_1.app.quit();
    });
    electron_1.ipcMain.handle("get-initial-status", async () => {
        const dotnetInstalled = await (0, dotnet_1.checkDotnet)();
        const appInstalled = (await (0, installer_1.getInstallPath)()) !== null;
        return {
            dotnetInstalled,
            appInstalled,
            serverRunning: (0, server_1.isServerRunning)(),
        };
    });
    sendToRenderer("app-ready");
});
electron_1.app.on("window-all-closed", () => {
    electron_1.app.quit();
});
electron_1.app.on("before-quit", () => {
    (0, server_1.stopServer)();
});
electron_1.app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
        (0, ipc_handlers_1.setupIpcHandlers)(mainWindow);
    }
});
//# sourceMappingURL=main.js.map