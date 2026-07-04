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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isServerRunning = isServerRunning;
exports.getServerUrl = getServerUrl;
exports.startServer = startServer;
exports.stopServer = stopServer;
const child_process_1 = require("child_process");
const util_1 = require("util");
const http = __importStar(require("http"));
const tree_kill_1 = __importDefault(require("tree-kill"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let serverProcess = null;
let serverReady = false;
function isServerRunning() {
    return serverProcess !== null && !serverProcess.killed;
}
function getServerUrl() {
    return "http://localhost:8080";
}
async function startServer(projectPath, onStatus) {
    if (isServerRunning()) {
        stopServer();
    }
    onStatus?.("Starting LLE server...");
    const dotnetBin = process.platform === "win32" ? "dotnet.exe" : "dotnet";
    serverProcess = (0, child_process_1.spawn)(dotnetBin, ["run", "--project", "App/Code/Core/Application"], {
        cwd: projectPath,
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32",
    });
    serverProcess.stdout?.on("data", (data) => {
        const msg = data.toString();
        console.log("[SERVER]", msg);
        if (msg.includes("Now listening on")) {
            serverReady = true;
            onStatus?.("Server is ready!");
        }
    });
    serverProcess.stderr?.on("data", (data) => {
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
function waitForServer(onStatus, maxAttempts = 120, intervalMs = 1000) {
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
                }
                else {
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
function stopServer() {
    if (serverProcess && serverProcess.pid) {
        try {
            (0, tree_kill_1.default)(serverProcess.pid, "SIGKILL", (err) => {
                if (err) {
                    console.error("treeKill failed:", err);
                }
            });
        }
        catch { }
        serverProcess = null;
        serverReady = false;
    }
}
//# sourceMappingURL=server.js.map