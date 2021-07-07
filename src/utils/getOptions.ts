import RawOptions from '../types/RawOptions';
import Options from '../types/Options';
import normalizePath from './normalizePath';
import NormalizedPath from '../types/NormalizedPath';

let options: Options;

export default function getOptions() {
    return options;
}

const DEFAULT_MAX_PARTIAL_CHECK_LIMIT = 1000;

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

    if (rawOptions.checkFiles && rawOptions.sinceGitHash) {
        throw new Error('Cannot specify --checkFiles and --sinceGitHash');
    }

    if (rawOptions.partialCheckLimit && !rawOptions.checkFiles && !rawOptions.sinceGitHash) {
        throw new Error(
            'Cannot specify --partialCheckLimit without --checkFiles or --sinceGitHash'
        );
    }

    options = {
        project,
        rootDir,
        ignoreExternalFences: rawOptions.ignoreExternalFences,
        partialCheck: rawOptions?.checkFiles
            ? {
                  fences: rawOptions.checkFiles
                      .filter(f => f.endsWith('fence.json'))
                      .map(p => normalizePath(p)),
                  sourceFiles: rawOptions.checkFiles
                      .filter(f => !f.endsWith('fence.json'))
                      .map(p => normalizePath(p)),
              }
            : undefined,
        partialCheckLimit: rawOptions?.partialCheckLimit || DEFAULT_MAX_PARTIAL_CHECK_LIMIT,
        sinceGitHash: rawOptions.sinceGitHash,
        looseRootFileDiscovery: rawOptions.looseRootFileDiscovery || false,
        maxConcurrentFenceJobs: rawOptions.maxConcurrentJobs || 6000,
    };
}
