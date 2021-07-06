import RawOptions from '../types/RawOptions';
import getOptions, { setOptions } from '../utils/getOptions';
import validateFile from '../validation/validateFile';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';
import { getResult, reportWarning } from './result';
import { validateTagsExist } from '../validation/validateTagsExist';
// import { GlobSourceFileProvider } from './GlobSourceFileProvider';
import { SourceFileProvider } from './SourceFileProvider';
import { FDirSourceFileProvider } from './FdirSourceFileProvider';
import { batchRunAll } from '../utils/batchRunAll';
import NormalizedPath from '../types/NormalizedPath';
import getConfigManager from '../utils/getConfigManager';
import Options from '../types/Options';
import { getFenceAndImportDiffsFromGit } from '../utils/getFenceAndImportDiffsFromGit';
import { getPartialCheckFromImportDiffs } from '../utils/getPartialCheckFromImportDiffs';
import { tick } from '../utils/tick';
import * as path from 'path';

const MAX_VALIDATION_BATCHSIZE = 6000;

async function getParitalCheck(): Promise<Options['partialCheck']> {
    let options = getOptions();
    let partialCheck: Options['partialCheck'] = undefined;
    if (options.partialCheck) {
        partialCheck = options.partialCheck;
    } else if (options.sinceGitHash) {
        console.log('getting diff from git...', tick());
        const diffs = await getFenceAndImportDiffsFromGit(options.sinceGitHash);
        console.log('getting partial check from fence / import diff...', tick());
        console.log(
            'diffs in fences:',
            diffs.fenceDiffs.size,
            'diffs in sources:',
            diffs.sourceImportDiffs.size
        );
        if (diffs) {
            console.log(require('util').inspect(diffs, { depth: 11 }));
            partialCheck = await getPartialCheckFromImportDiffs(diffs);
        } else {
            console.log('cannot perform partial check');
        }
        console.log('took', tick());
    }

    return partialCheck;
}

async function getFilesNormalized(
    sourceFileProvider: SourceFileProvider,
    rootDirs?: string[]
): Promise<NormalizedPath[]> {
    console.log('took', tick());
    console.log(
        'instantiated provider',
        Object.getPrototypeOf(sourceFileProvider).constructor.name
    );
    console.log('fetching files..');
    let files = await sourceFileProvider.getSourceFiles(rootDirs);
    console.log('took', tick());
    console.log('normalizing paths...');
    const normalizedFiles = files.map(file => normalizePath(file));
    console.log('took', tick());
    return normalizedFiles;
}

export async function run(rawOptions: RawOptions) {
    console.log('storing options', tick());

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
        }
    }

    console.log('constructing source file provider...');
    let sourceFileProvider: SourceFileProvider = options.looseRootFileDiscovery
        ? new FDirSourceFileProvider(options.project, options.rootDir)
        : new TypeScriptProgram(options.project);
    console.log('took', tick());

    if (!partialCheck) {
        console.log('preloading all fences...');
        getConfigManager().all;
        console.log('took', tick());

        console.log('validating tags on all fences...');
        validateTagsExist();
    }
    console.log('took', tick());

    console.log('performing validation...');
    if (partialCheck) {
        // validate only those files specified on the command line,
        // or included in the scope of changed fence files.
        // TODO partial file discovery
        console.log(
            'fence paths',
            partialCheck.fences.map(fencePath => path.dirname(fencePath))
        );
        const fenceScopeFiles = await getFilesNormalized(
            sourceFileProvider,
            partialCheck.fences.map(fencePath => path.dirname(fencePath))
        );
        console.log(
            'partialCheck.sourceFiles',
            partialCheck.sourceFiles,
            'fenceScopeFiles',
            fenceScopeFiles.length
        );
        await batchRunAll(
            MAX_VALIDATION_BATCHSIZE,
            [...partialCheck.sourceFiles, ...fenceScopeFiles],
            (normalizedFile: NormalizedPath) => validateFile(normalizedFile, sourceFileProvider)
        );
    } else {
        console.log('getting all files');
        const normalizedFiles = await getFilesNormalized(sourceFileProvider);
        console.log(
            'any undef?',
            normalizedFiles.some(file => file == undefined)
        );
        console.log('took', tick());

        // validate all files in batches to avoid MFILE
        await batchRunAll(
            MAX_VALIDATION_BATCHSIZE,
            normalizedFiles,
            (normalizedFile: NormalizedPath) => validateFile(normalizedFile, sourceFileProvider)
        );
    }
    console.log('took', tick());
    return getResult();
}
