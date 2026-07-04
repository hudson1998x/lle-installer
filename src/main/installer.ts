import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as https from "https";
import { exec } from "child_process";
import { promisify } from "util";
import { fetchJson, downloadFile } from "./utils";

const execAsync = promisify(exec);

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  zipball_url: string;
}

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

export function getHomeDir(): string {
  return os.homedir();
}

export function getLleBasePath(): string {
  return path.join(getHomeDir(), "LLE");
}

export async function getInstallPath(): Promise<string | null> {
  const basePath = getLleBasePath();
  if (fs.existsSync(path.join(basePath, "LLE.sln")) || fs.existsSync(path.join(basePath, "App"))) {
    return basePath;
  }

  if (fs.existsSync(basePath)) {
    const entries = fs.readdirSync(basePath);
    for (const entry of entries) {
      const entryPath = path.join(basePath, entry);
      if (fs.statSync(entryPath).isDirectory()) {
        if (fs.existsSync(path.join(entryPath, "LLE.sln")) || fs.existsSync(path.join(entryPath, "App"))) {
          return entryPath;
        }
      }
    }
  }

  return null;
}

export async function getReleases(): Promise<GitHubRelease[]> {
  const url = "https://api.github.com/repos/hudson1998x/language-learning-platform/releases";
  return fetchJson<GitHubRelease[]>(url);
}

function extractZip(zipPath: string, destDir: string): Promise<void> {
  const platform = os.platform();

  if (platform === "win32") {
    return execAsync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`
    ).then(() => {});
  }

  return execAsync(`unzip -o "${zipPath}" -d "${destDir}"`).then(() => {});
}

export async function installLle(
  tag: string,
  zipballUrl: string,
  onProgress?: (message: string) => void
): Promise<string> {
  const basePath = getLleBasePath();

  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  const zipPath = path.join(os.tmpdir(), `lle-${tag}.zip`);
  onProgress?.(`Downloading version ${tag}...`);

  await downloadFile(zipballUrl, zipPath, (pct) => {
    onProgress?.(`Downloading version ${tag}... ${pct}%`);
  });

  onProgress?.("Extracting files...");
  await extractZip(zipPath, basePath);

  try {
    fs.unlinkSync(zipPath);
  } catch {}

  const entries = fs.readdirSync(basePath);
  let projectDir = basePath;

  for (const entry of entries) {
    const entryPath = path.join(basePath, entry);
    if (fs.statSync(entryPath).isDirectory() && entry.startsWith("hudson1998x-language-learning-platform")) {
      projectDir = entryPath;
      break;
    }
  }

  onProgress?.("Running dotnet restore...");
  try {
    await execAsync("dotnet restore", { cwd: projectDir });
  } catch {
    // Non-fatal: some projects in the solution may be missing (e.g. Scenarios)
  }

  onProgress?.("Installation complete!");
  return projectDir;
}

export async function getAvailableVersions(): Promise<
  { tag: string; name: string; date: string; zipballUrl: string }[]
> {
  const releases = await getReleases();
  return releases.map((r) => ({
    tag: r.tag_name,
    name: r.name || r.tag_name,
    date: r.published_at,
    zipballUrl: r.zipball_url,
  }));
}
