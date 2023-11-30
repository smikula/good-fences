import RawOptions from '../types/RawOptions';
import Options from '../types/Options';
import normalizePath from './normalizePath';
import NormalizedPath from '../types/NormalizedPath';

let options: Options;

export default function getOptions() {
    return options;
}

export function setOptions(rawOptions: RawOptions) {
    // Normalize and apply defaults
    const nonNormalizedRoots: string[] = Array.isArray(rawOptions.rootDir)
        ? rawOptions.rootDir
        : [rawOptions.rootDir || process.cwd()];

    const rootDir: NormalizedPath[] = nonNormalizedRoots.map((individualRootDirPath: string) =>
        normalizePath(individualRootDirPath)
    );

    const project = rawOptions.project
        ? normalizePath(rawOptions.project)
        : normalizePath(rootDir[0], 'tsconfig.json');

    if (typeof rawOptions.partialCheckLimit === 'number' && !rawOptions.sinceGitHash) {
        throw new Error('Cannot specify --partialCheckLimit without --sinceGitHash');
    }

    options = {
        project,
        rootDir,
        ignoreExternalFences: rawOptions.ignoreExternalFences,
        partialCheckLimit: rawOptions?.partialCheckLimit,
        sinceGitHash: rawOptions.sinceGitHash,
        looseRootFileDiscovery: rawOptions.looseRootFileDiscovery || false,
        maxConcurrentFenceJobs: rawOptions.maxConcurrentJobs || 6000,
        progress: rawOptions.progressBar || false,
        excludeFilesPattern: rawOptions.excludeFilesPattern,
    };
}
