import RawOptions from '../types/RawOptions';
import getOptions, { setOptions } from '../utils/getOptions';
import validateFile from '../validation/validateFile';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';
import { getResult, reportWarning } from './result';
import { validateTagsExist } from '../validation/validateTagsExist';
import { SourceFileProvider } from './SourceFileProvider';
import { FDirSourceFileProvider } from './FdirSourceFileProvider';
import { batchRunAll } from '../utils/batchRunAll';
import NormalizedPath from '../types/NormalizedPath';
import getConfigManager from '../utils/getConfigManager';
import Options from '../types/Options';
import { getFenceAndImportDiffsFromGit } from '../utils/getFenceAndImportDiffsFromGit';
import { getPartialCheckFromImportDiffs } from '../utils/getPartialCheckFromImportDiffs';
import * as path from 'path';

async function getParitalCheck(): Promise<Options['partialCheck']> {
    let options = getOptions();
    let partialCheck: Options['partialCheck'] = undefined;
    if (options.partialCheck) {
        partialCheck = options.partialCheck;
    } else if (options.sinceGitHash) {
        const diffs = await getFenceAndImportDiffsFromGit(options.sinceGitHash);
        if (diffs) {
            partialCheck = await getPartialCheckFromImportDiffs(diffs);
        }
    }

    return partialCheck;
}

async function getFilesNormalized(
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

    let partialCheck = await getParitalCheck();
    if (partialCheck && partialCheck.fences.length == 0 && partialCheck.sourceFiles.length == 0) {
        reportWarning('Skipping fence validation -- no fences or source files have changed');
        return getResult();
    }

    let options = getOptions();
    if (options.partialCheckLimit) {
        if (!partialCheck) {
            reportWarning(
                `Skipping fence validation -- Could not calculate a partial check, but partialCheckLimit was specified in options`
            );
            return getResult();
        }
        if (
            partialCheck.fences.length + partialCheck.sourceFiles.length >
            options.partialCheckLimit
        ) {
            reportWarning(
                `Skipping fence validation -- the partial check had more than ${options.partialCheckLimit} changes`
            );
            return getResult();
        }
    }

    let sourceFileProvider: SourceFileProvider = options.looseRootFileDiscovery
        ? new FDirSourceFileProvider(options.project, options.rootDir)
        : new TypeScriptProgram(options.project);

    if (!partialCheck) {
        getConfigManager().all;
        // validating tags exist requires a full load of all fences
        // we can't do this in partial check mode
        validateTagsExist();
    } else {
        reportWarning(
            `skipping validateTagsExist -- cannot validate tag existence while performing checks`
        );
    }

    if (partialCheck) {
        // validate only those files specified on the command line,
        // or included in the scope of changed fence files.
        const fenceScopeFiles = await getFilesNormalized(
            sourceFileProvider,
            partialCheck.fences.map(fencePath => path.dirname(fencePath))
        );

        const fenceJobs = [...partialCheck.sourceFiles, ...fenceScopeFiles];

        // we have to limit the concurrent executed promises because
        // otherwise we will open all the files at the same time and
        // hit the MFILE error (when we hit rlimit)
        await batchRunAll(
            options.maxConcurrentFenceJobs,
            fenceJobs,
            (normalizedFile: NormalizedPath) => validateFile(normalizedFile, sourceFileProvider),
            options.progress
        );
    } else {
        const normalizedFiles = await getFilesNormalized(sourceFileProvider);

        // we have to limit the concurrent executed promises because
        // otherwise we will open all the files at the same time and
        // hit the MFILE error (when we hit rlimit)
        await batchRunAll(
            options.maxConcurrentFenceJobs,
            normalizedFiles,
            (normalizedFile: NormalizedPath) => validateFile(normalizedFile, sourceFileProvider),
            options.progress
        );
    }
    return getResult();
}
