export default interface RawOptions {
    project?: string;
    rootDir?: string | string[];
    ignoreExternalFences?: boolean;
    maxConcurrentJobs?: number;
    progressBar?: boolean;
}
