import NormalizedPath from './NormalizedPath';

export default interface Options {
    project: NormalizedPath;
    rootDir: NormalizedPath[];
    ignoreExternalFences: boolean;
    looseRootFileDiscovery: boolean;
    /**
     * Specific source files to validate.
     */
    partialCheck?: {
        fences: NormalizedPath[];
        sourceFiles: NormalizedPath[];
    };
    partialCheckLimit: number;
    sinceGitHash?: string;
    // Maximum number of fence validation jobs that can
    // be run at the same time.
    //
    // this should be set under the system rlimit,
    // otherwise you will hit the MFILE error when
    // we try to open too many files concurrently.
    maxConcurrentFenceJobs: number;
    progress: boolean;
}
