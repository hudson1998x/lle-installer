import * as https from "https";
import * as http from "http";
import * as fs from "fs";

export function downloadFile(
  url: string,
  dest: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith("https") ? https : http;

    const request = client.get(url, { headers: { "User-Agent": "LLE-Installer/1.0" } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(dest);
          downloadFile(redirectUrl, dest, onProgress).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
      let downloadedBytes = 0;

      response.on("data", (chunk: Buffer) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0 && onProgress) {
          const pct = Math.round((downloadedBytes / totalBytes) * 100);
          onProgress(pct);
        }
      });

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        resolve();
      });

      file.on("error", (err) => {
        fs.unlinkSync(dest);
        reject(err);
      });
    });

    request.on("error", (err) => {
      file.close();
      try {
        fs.unlinkSync(dest);
      } catch {}
      reject(err);
    });
  });
}

export async function fetchJson<T>(url: string): Promise<T> {
  const client = url.startsWith("https") ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(url, { headers: { "User-Agent": "LLE-Installer/1.0" } }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      let data = "";
      response.on("data", (chunk: Buffer) => {
        data += chunk.toString();
      });

      response.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });

    request.on("error", reject);
  });
}
