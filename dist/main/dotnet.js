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
exports.checkDotnet = checkDotnet;
exports.installDotnet = installDotnet;
const child_process_1 = require("child_process");
const util_1 = require("util");
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./utils");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function checkDotnet() {
    try {
        const { stdout } = await execFileAsync("dotnet", ["--version"]);
        return stdout.trim();
    }
    catch {
        return null;
    }
}
function getDotnetInstallScriptUrl() {
    const platform = os.platform();
    if (platform === "win32") {
        return "https://dot.net/v1/dotnet-install.ps1";
    }
    return "https://dot.net/v1/dotnet-install.sh";
}
function getDotnetInstallScriptName() {
    return os.platform() === "win32" ? "dotnet-install.ps1" : "dotnet-install.sh";
}
async function installDotnet(onProgress) {
    const scriptName = getDotnetInstallScriptName();
    const scriptUrl = getDotnetInstallScriptUrl();
    const tmpDir = os.tmpdir();
    const scriptPath = path.join(tmpDir, scriptName);
    onProgress?.("Downloading .NET install script...");
    try {
        await (0, utils_1.downloadFile)(scriptUrl, scriptPath, (pct) => {
            onProgress?.(`Downloading .NET install script... ${pct}%`);
        });
        const platform = os.platform();
        if (platform === "win32") {
            onProgress?.("Installing .NET 10 SDK (this may take a few minutes)...");
            await execAsync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Channel 10.0`);
        }
        else {
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
    }
    catch (err) {
        onProgress?.(`Failed to install .NET: ${err}`);
        return false;
    }
    finally {
        try {
            fs.unlinkSync(scriptPath);
        }
        catch { }
    }
}
//# sourceMappingURL=dotnet.js.map