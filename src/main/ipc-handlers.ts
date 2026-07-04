import { BrowserWindow, ipcMain, shell } from "electron";
import { checkDotnet, installDotnet } from "./dotnet";
import {
  getReleases,
  installLle,
  getInstallPath,
  getAvailableVersions,
} from "./installer";
import { startServer, stopServer, isServerRunning, getServerUrl } from "./server";
import { uninstall } from "./uninstall";
import { switchVersion } from "./updater";

let mainWindow: BrowserWindow | null = null;

function send(channel: string, ...args: unknown[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

export function setupIpcHandlers(window: BrowserWindow | null): void {
  mainWindow = window;

  ipcMain.handle("check-dotnet", async () => {
    return await checkDotnet();
  });

  ipcMain.handle("install-dotnet", async () => {
    return await installDotnet((msg) => {
      send("dotnet-progress", msg);
    });
  });

  ipcMain.handle("get-releases", async () => {
    return await getAvailableVersions();
  });

  ipcMain.handle("install-lle", async (_event, tag: string, zipballUrl: string) => {
    const projectPath = await installLle(tag, zipballUrl, (msg) => {
      send("install-progress", msg);
    });
    return projectPath;
  });

  ipcMain.handle("start-server", async (_event, projectPath: string) => {
    await startServer(projectPath, (msg) => {
      send("server-status", msg);
    });
    const url = getServerUrl();
    mainWindow?.loadURL(url);
    return url;
  });

  ipcMain.handle("stop-server", async () => {
    stopServer();
    return true;
  });

  ipcMain.handle("switch-version", async (_event, tag: string, zipballUrl: string) => {
    const projectPath = await switchVersion(tag, zipballUrl, (msg) => {
      send("switch-progress", msg);
    });
    return projectPath;
  });

  ipcMain.handle("uninstall", async () => {
    await uninstall((msg) => {
      send("uninstall-progress", msg);
    });
    return true;
  });

  ipcMain.handle("get-install-path", async () => {
    return await getInstallPath();
  });

  ipcMain.handle("get-server-url", async () => {
    return getServerUrl();
  });

  ipcMain.handle("is-server-running", async () => {
    return isServerRunning();
  });

  ipcMain.handle("open-url", async (_event, url: string) => {
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle("close-window", async () => {
    mainWindow?.close();
    return true;
  });

  ipcMain.handle("go-back", async () => {
    stopServer();
    const rendererPath = require("path").join(__dirname, "../renderer/index.html");
    mainWindow?.loadFile(rendererPath);
    return true;
  });
}
