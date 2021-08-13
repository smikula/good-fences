export default interface RawOptions {
    project?: string;
    rootDir?: string | string[];
    ignoreExternalFences?: boolean;
    looseRootFileDiscovery?: boolean;
    maxConcurrentJobs?: number;
    progressBar?: boolean;
}
