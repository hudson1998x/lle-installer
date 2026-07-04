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
exports.downloadFile = downloadFile;
exports.fetchJson = fetchJson;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
function downloadFile(url, dest, onProgress) {
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
            response.on("data", (chunk) => {
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
            }
            catch { }
            reject(err);
        });
    });
}
async function fetchJson(url) {
    const client = url.startsWith("https") ? https : http;
    return new Promise((resolve, reject) => {
        const request = client.get(url, { headers: { "User-Agent": "LLE-Installer/1.0" } }, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            let data = "";
            response.on("data", (chunk) => {
                data += chunk.toString();
            });
            response.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (err) {
                    reject(err);
                }
            });
        });
        request.on("error", reject);
    });
}
//# sourceMappingURL=utils.js.map