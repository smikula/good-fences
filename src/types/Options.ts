import NormalizedPath from './NormalizedPath';

export default interface Options {
    project: NormalizedPath;
    rootDir: NormalizedPath[];
    ignoreExternalFences: boolean;
    partialCheckLimit: number;
    sinceGitHash?: string;
    looseRootFileDiscovery: boolean;
    // Maximum number of fence validation jobs that can
    // be run at the same time.
    //
    // This should be set under the system rlimit,
    // otherwise you will hit the MFILE error when
    // we try to open too many files concurrently.
    maxConcurrentFenceJobs: number;
    progress: boolean;
}
