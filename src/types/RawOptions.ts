export default interface RawOptions {
    project?: string;
    rootDir?: string | string[];
    ignoreExternalFences?: boolean;
    sinceGitHash?: string;
    partialCheckLimit?: number;
    looseRootFileDiscovery?: boolean;
    maxConcurrentJobs?: number;
    progressBar?: boolean;
}
