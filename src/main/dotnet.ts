import { execFile, exec } from "child_process";
import { promisify } from "util";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { downloadFile } from "./utils";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

export async function checkDotnet(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("dotnet", ["--version"]);
    return stdout.trim();
  } catch {
    return null;
  }
}

function getDotnetInstallScriptUrl(): string {
  const platform = os.platform();
  if (platform === "win32") {
    return "https://dot.net/v1/dotnet-install.ps1";
  }
  return "https://dot.net/v1/dotnet-install.sh";
}

function getDotnetInstallScriptName(): string {
  return os.platform() === "win32" ? "dotnet-install.ps1" : "dotnet-install.sh";
}

export async function installDotnet(
  onProgress?: (message: string) => void
): Promise<boolean> {
  const scriptName = getDotnetInstallScriptName();
  const scriptUrl = getDotnetInstallScriptUrl();
  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, scriptName);

  onProgress?.("Downloading .NET install script...");

  try {
    await downloadFile(scriptUrl, scriptPath, (pct) => {
      onProgress?.(`Downloading .NET install script... ${pct}%`);
    });

    const platform = os.platform();

    if (platform === "win32") {
      onProgress?.("Installing .NET 10 SDK (this may take a few minutes)...");
      await execAsync(
        `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Channel 10.0`
      );
    } else {
      onProgress?.("Installing .NET 10 SDK (this may take a few minutes)...");
      fs.chmodSync(scriptPath, 0o755);
      await execAsync(`bash "${scriptPath}" --channel 10.0`);
    }

    onProgress?.("Verifying .NET installation...");
    const version = await checkDotnet();
    if (version) {
      onProgress?.(`.NET installed successfully: ${version}`);
      return true;
    }

    onProgress?.(".NET installation could not be verified.");
    return false;
  } catch (err) {
    onProgress?.(`Failed to install .NET: ${err}`);
    return false;
  } finally {
    try {
      fs.unlinkSync(scriptPath);
    } catch {}
  }
}
