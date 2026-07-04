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
exports.getHomeDir = getHomeDir;
exports.getLleBasePath = getLleBasePath;
exports.getInstallPath = getInstallPath;
exports.getReleases = getReleases;
exports.installLle = installLle;
exports.getAvailableVersions = getAvailableVersions;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const utils_1 = require("./utils");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
function getHomeDir() {
    return os.homedir();
}
function getLleBasePath() {
    return path.join(getHomeDir(), "LLE");
}
async function getInstallPath() {
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
async function getReleases() {
    const url = "https://api.github.com/repos/hudson1998x/language-learning-platform/releases";
    return (0, utils_1.fetchJson)(url);
}
function extractZip(zipPath, destDir) {
    const platform = os.platform();
    if (platform === "win32") {
        return execAsync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`).then(() => { });
    }
    return execAsync(`unzip -o "${zipPath}" -d "${destDir}"`).then(() => { });
}
async function installLle(tag, zipballUrl, onProgress) {
    const basePath = getLleBasePath();
    if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
    }
    const zipPath = path.join(os.tmpdir(), `lle-${tag}.zip`);
    onProgress?.(`Downloading version ${tag}...`);
    await (0, utils_1.downloadFile)(zipballUrl, zipPath, (pct) => {
        onProgress?.(`Downloading version ${tag}... ${pct}%`);
    });
    onProgress?.("Extracting files...");
    await extractZip(zipPath, basePath);
    try {
        fs.unlinkSync(zipPath);
    }
    catch { }
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
    }
    catch {
        // Non-fatal: some projects in the solution may be missing (e.g. Scenarios)
    }
    onProgress?.("Installation complete!");
    return projectDir;
}
async function getAvailableVersions() {
    const releases = await getReleases();
    return releases.map((r) => ({
        tag: r.tag_name,
        name: r.name || r.tag_name,
        date: r.published_at,
        zipballUrl: r.zipball_url,
    }));
}
//# sourceMappingURL=installer.js.map