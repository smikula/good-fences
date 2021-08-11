export default interface RawOptions {
    project?: string;
    rootDir?: string | string[];
    ignoreExternalFences?: boolean;
    looseRootFileDiscovery?: boolean;
    sinceGitHash?: string;
    partialCheckLimit?: number;
    maxConcurrentJobs?: number;
    progressBar?: boolean;
}
