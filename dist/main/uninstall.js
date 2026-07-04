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
exports.uninstall = uninstall;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const server_1 = require("./server");
const installer_1 = require("./installer");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function uninstall(onProgress) {
    onProgress?.("Stopping server...");
    (0, server_1.stopServer)();
    onProgress?.("Removing desktop shortcuts...");
    await removeDesktopShortcuts();
    onProgress?.("Removing application files...");
    const basePath = (0, installer_1.getLleBasePath)();
    if (fs.existsSync(basePath)) {
        fs.rmSync(basePath, { recursive: true, force: true });
    }
    onProgress?.("Uninstall complete!");
}
async function removeDesktopShortcuts() {
    const platform = os.platform();
    if (platform === "win32") {
        const desktopPath = path.join(os.homedir(), "Desktop");
        const startMenuPath = path.join(os.homedir(), "AppData", "Roaming", "Microsoft", "Windows", "Start Menu", "Programs");
        removeFilesContaining(desktopPath, "LLE");
        removeFilesContaining(startMenuPath, "LLE");
    }
    else if (platform === "darwin") {
        const desktopPath = path.join(os.homedir(), "Desktop");
        removeFilesContaining(desktopPath, "LLE");
        const appPath = "/Applications";
        removeFilesContaining(appPath, "LLE");
    }
    else {
        const desktopPath = path.join(os.homedir(), "Desktop");
        removeFilesContaining(desktopPath, "LLE");
        const applicationsPath = "/usr/share/applications";
        removeFilesContaining(applicationsPath, "LLE");
    }
}
function removeFilesContaining(dir, search) {
    if (!fs.existsSync(dir))
        return;
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        if (entry.toLowerCase().includes(search.toLowerCase())) {
            const entryPath = path.join(dir, entry);
            try {
                fs.rmSync(entryPath, { recursive: true, force: true });
            }
            catch { }
        }
    }
}
//# sourceMappingURL=uninstall.js.map