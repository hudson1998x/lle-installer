import { app, BrowserWindow, ipcMain, Menu } from "electron";
import * as path from "path";
import { checkDotnet, installDotnet } from "./dotnet";
import { getReleases, installLle, getInstallPath } from "./installer";
import { startServer, stopServer, isServerRunning, getServerUrl } from "./server";
import { uninstall } from "./uninstall";
import { switchVersion } from "./updater";
import { setupIpcHandlers } from "./ipc-handlers";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
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
    if (isServerRunning()) {
      stopServer();
    }
    mainWindow = null;
  });
}

function sendToRenderer(channel: string, ...args: unknown[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

app.whenReady().then(async () => {
  createWindow();
  setupIpcHandlers(mainWindow);

  ipcMain.on("cancel-dotnet-install", () => {
    app.quit();
  });

  ipcMain.handle("get-initial-status", async () => {
    const dotnetInstalled = await checkDotnet();
    const appInstalled = (await getInstallPath()) !== null;

    return {
      dotnetInstalled,
      appInstalled,
      serverRunning: isServerRunning(),
    };
  });

  sendToRenderer("app-ready");
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  stopServer();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
    setupIpcHandlers(mainWindow);
  }
});
