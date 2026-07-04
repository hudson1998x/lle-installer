interface LLEBridge {
  checkDotnet: () => Promise<string | null>;
  installDotnet: () => Promise<boolean>;
  getReleases: () => Promise<{ tag: string; name: string; date: string; zipballUrl: string }[]>;
  installLle: (tag: string, zipballUrl: string) => Promise<string>;
  startServer: (projectPath: string) => Promise<string>;
  stopServer: () => Promise<boolean>;
  switchVersion: (tag: string, zipballUrl: string) => Promise<string>;
  uninstall: () => Promise<boolean>;
  getInstallPath: () => Promise<string | null>;
  getServerUrl: () => Promise<string>;
  isServerRunning: () => Promise<boolean>;
  openUrl: (url: string) => Promise<boolean>;
  closeWindow: () => Promise<boolean>;
  getInitialStatus: () => Promise<{
    dotnetInstalled: string | null;
    appInstalled: boolean;
    serverRunning: boolean;
  }>;
  onDotnetProgress: (callback: (msg: string) => void) => void;
  onInstallProgress: (callback: (msg: string) => void) => void;
  onServerStatus: (callback: (msg: string) => void) => void;
  onSwitchProgress: (callback: (msg: string) => void) => void;
  onUninstallProgress: (callback: (msg: string) => void) => void;
  onAppReady: (callback: () => void) => void;
}

declare global {
  interface Window {
    lle: LLEBridge;
  }
}

export {};
