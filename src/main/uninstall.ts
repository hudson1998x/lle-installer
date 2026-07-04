import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { stopServer } from "./server";
import { getLleBasePath } from "./installer";

const execAsync = promisify(exec);

export async function uninstall(onProgress?: (message: string) => void): Promise<void> {
  onProgress?.("Stopping server...");
  stopServer();

  onProgress?.("Removing desktop shortcuts...");
  await removeDesktopShortcuts();

  onProgress?.("Removing application files...");
  const basePath = getLleBasePath();
  if (fs.existsSync(basePath)) {
    fs.rmSync(basePath, { recursive: true, force: true });
  }

  onProgress?.("Uninstall complete!");
}

async function removeDesktopShortcuts(): Promise<void> {
  const platform = os.platform();

  if (platform === "win32") {
    const desktopPath = path.join(os.homedir(), "Desktop");
    const startMenuPath = path.join(
      os.homedir(),
      "AppData",
      "Roaming",
      "Microsoft",
      "Windows",
      "Start Menu",
      "Programs"
    );

    removeFilesContaining(desktopPath, "LLE");
    removeFilesContaining(startMenuPath, "LLE");
  } else if (platform === "darwin") {
    const desktopPath = path.join(os.homedir(), "Desktop");
    removeFilesContaining(desktopPath, "LLE");

    const appPath = "/Applications";
    removeFilesContaining(appPath, "LLE");
  } else {
    const desktopPath = path.join(os.homedir(), "Desktop");
    removeFilesContaining(desktopPath, "LLE");

    const applicationsPath = "/usr/share/applications";
    removeFilesContaining(applicationsPath, "LLE");
  }
}

function removeFilesContaining(dir: string, search: string): void {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry.toLowerCase().includes(search.toLowerCase())) {
      const entryPath = path.join(dir, entry);
      try {
        fs.rmSync(entryPath, { recursive: true, force: true });
      } catch {}
    }
  }
}
