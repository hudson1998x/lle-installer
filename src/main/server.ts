import { ChildProcess, spawn, exec } from "child_process";
import { promisify } from "util";
import * as http from "http";
import treeKill from "tree-kill";

const execAsync = promisify(exec);

let serverProcess: ChildProcess | null = null;
let serverReady = false;

export function isServerRunning(): boolean {
  return serverProcess !== null && !serverProcess.killed;
}

export function getServerUrl(): string {
  return "http://localhost:8080";
}

export async function startServer(
  projectPath: string,
  onStatus?: (status: string) => void
): Promise<void> {
  if (isServerRunning()) {
    stopServer();
  }

  onStatus?.("Starting LLE server...");

  const dotnetBin = process.platform === "win32" ? "dotnet.exe" : "dotnet";

  serverProcess = spawn(dotnetBin, ["run", "--project", "App/Code/Core/Application"], {
    cwd: projectPath,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  serverProcess.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString();
    console.log("[SERVER]", msg);
    if (msg.includes("Now listening on")) {
      serverReady = true;
      onStatus?.("Server is ready!");
    }
  });

  serverProcess.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString();
    console.log("[SERVER ERR]", msg);
    if (msg.includes("Now listening on")) {
      serverReady = true;
      onStatus?.("Server is ready!");
    }
  });

  serverProcess.on("error", (err) => {
    onStatus?.(`Server error: ${err.message}`);
    serverProcess = null;
    serverReady = false;
  });

  serverProcess.on("exit", (code) => {
    onStatus?.(`Server exited with code ${code}`);
    serverProcess = null;
    serverReady = false;
  });

  await waitForServer(onStatus);
}

function waitForServer(
  onStatus?: (status: string) => void,
  maxAttempts = 120,
  intervalMs = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts++;

      if (!isServerRunning()) {
        reject(new Error("Server process exited before becoming ready"));
        return;
      }

      if (serverReady) {
        onStatus?.("Server is ready!");
        resolve();
        return;
      }

      const req = http.get(getServerUrl(), (res) => {
        if (res.statusCode && res.statusCode < 500) {
          serverReady = true;
          onStatus?.("Server is ready!");
          resolve();
        } else {
          retry();
        }
        res.resume();
      });

      req.on("error", () => {
        retry();
      });

      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (attempts >= maxAttempts) {
        reject(new Error("Server did not become ready within expected time"));
        return;
      }
      setTimeout(check, intervalMs);
    };

    setTimeout(check, 2000);
  });
}

export function stopServer(): void {
  if (serverProcess && serverProcess.pid) {
    try {
      treeKill(serverProcess.pid, "SIGKILL", (err) => {
        if (err) {
          console.error("treeKill failed:", err);
        }
      });
    } catch {}
    serverProcess = null;
    serverReady = false;
  }
}
