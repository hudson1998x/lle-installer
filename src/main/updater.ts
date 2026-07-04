import { stopServer } from "./server";
import { installLle, getLleBasePath } from "./installer";
import * as fs from "fs";

export async function switchVersion(
  tag: string,
  zipballUrl: string,
  onProgress?: (message: string) => void
): Promise<string> {
  onProgress?.("Stopping current server...");
  stopServer();

  const basePath = getLleBasePath();
  if (fs.existsSync(basePath)) {
    onProgress?.("Removing old version...");
    fs.rmSync(basePath, { recursive: true, force: true });
  }

  onProgress?.(`Installing version ${tag}...`);
  const projectPath = await installLle(tag, zipballUrl, onProgress);

  return projectPath;
}
