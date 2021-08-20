import RawOptions from '../types/RawOptions';
import getOptions, { setOptions } from '../utils/getOptions';
import validateFile from '../validation/validateFile';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';
import { getResult, reportWarning } from './result';
import { validateTagsExist } from '../validation/validateTagsExist';
import { SourceFileProvider } from './SourceFileProvider';
import { FDirSourceFileProvider } from './FdirSourceFileProvider';
import NormalizedPath from '../types/NormalizedPath';
import { runWithConcurrentLimit } from '../utils/runWithConcurrentLimit';
import getConfigManager from '../utils/getConfigManager';
import { getFenceAndImportDiffsFromGit } from '../utils/getFenceAndImportDiffsFromGit';
import { getPartialCheckFromImportDiffs } from '../utils/getPartialCheckFromImportDiffs';
import * as path from 'path';
import { PartialCheck } from '../types/PartialCheck';

async function getPartialCheck(): Promise<PartialCheck> {
    let options = getOptions();
    if (options.sinceGitHash) {
        const diffs = await getFenceAndImportDiffsFromGit(options.sinceGitHash);
        if (diffs) {
            return getPartialCheckFromImportDiffs(diffs);
        }
    }
}

async function getSourceFilesNormalized(
    sourceFileProvider: SourceFileProvider,
    rootDirs?: string[]
): Promise<NormalizedPath[]> {
    let files = await sourceFileProvider.getSourceFiles(rootDirs);
    const normalizedFiles = files.map(file => normalizePath(file));
    return normalizedFiles;
}

export async function run(rawOptions: RawOptions) {
    // Store options so they can be globally available
    setOptions(rawOptions);
    let options = getOptions();

    let partialCheck = await getPartialCheck();
    if (options.partialCheckLimit) {
        if (!partialCheck) {
            reportWarning(
                `Skipping fence validation. Could not calculate a partial check, but partialCheckLimit was specified in options`
            );
            return getResult();
        }
        if (
            partialCheck.fences.length + partialCheck.sourceFiles.length >
            options.partialCheckLimit
        ) {
            reportWarning(
                `Skipping fence validation. The partial check had more than ${options.partialCheckLimit} changes`
            );
            return getResult();
        }
    }

    let sourceFileProvider: SourceFileProvider = options.looseRootFileDiscovery
        ? new FDirSourceFileProvider(options.project, options.rootDir)
        : new TypeScriptProgram(options.project);

    if (!partialCheck) {
        // Validating tags exist requires a full load of all fences
        // we can't do this in partial check mode.
        //
        // Prefetching the full config set here avoids the overhead
        // of partial fence loading, since we know we are loading
        // the full fence set.
        getConfigManager().getAllConfigs();
        validateTagsExist();
    } else {
        reportWarning(
            `Skipping validateTagsExist. Cannot validate tag existence during partial checks`
        );
    }

    if (partialCheck) {
        // Validate only those files specified on the command line,
        // or included in the scope of changed fence files.
        const fenceScopeFiles = await getSourceFilesNormalized(
            sourceFileProvider,
            partialCheck.fences.map((fencePath: NormalizedPath) => path.dirname(fencePath))
        );

        const normalizedFiles = [...partialCheck.sourceFiles, ...fenceScopeFiles];

        // we have to limit the concurrent executed promises because
        // otherwise we will open all the files at the same time and
        // hit the MFILE error (when we hit rlimit)
        await runWithConcurrentLimit(
            options.maxConcurrentFenceJobs,
            normalizedFiles,
            (normalizedFile: NormalizedPath) => validateFile(normalizedFile, sourceFileProvider),
            options.progress
        );
    } else {
        const normalizedFiles = await getSourceFilesNormalized(sourceFileProvider);

        // Limit the concurrent executed promises because
        // otherwise we will open all the files at the same time and
        // hit the MFILE error (when we hit rlimit)
        await runWithConcurrentLimit(
            options.maxConcurrentFenceJobs,
            normalizedFiles,
            (normalizedFile: NormalizedPath) => validateFile(normalizedFile, sourceFileProvider),
            options.progress
        );
    }
    return getResult();
}
