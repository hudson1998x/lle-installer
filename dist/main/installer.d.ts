interface GitHubRelease {
    tag_name: string;
    name: string;
    body: string;
    published_at: string;
    zipball_url: string;
}
export declare function getHomeDir(): string;
export declare function getLleBasePath(): string;
export declare function getInstallPath(): Promise<string | null>;
export declare function getReleases(): Promise<GitHubRelease[]>;
export declare function installLle(tag: string, zipballUrl: string, onProgress?: (message: string) => void): Promise<string>;
export declare function getAvailableVersions(): Promise<{
    tag: string;
    name: string;
    date: string;
    zipballUrl: string;
}[]>;
export {};
//# sourceMappingURL=installer.d.ts.map