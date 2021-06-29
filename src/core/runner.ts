import RawOptions from '../types/RawOptions';
import getOptions, { setOptions } from '../utils/getOptions';
import validateFile from '../validation/validateFile';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';
import { getResult } from './result';
import { validateTagsExist } from '../validation/validateTagsExist';
import getConfigsForFile from '../utils/getConfigsForFile';
// import { GlobSourceFileProvider } from './GlobSourceFileProvider';
import { SourceFileProvider } from './SourceFileProvider';
import { FDirSourceFileProvider } from './FdirSourceFileProvider';
import { batchRunAll } from '../utils/batchRunAll';
import NormalizedPath from '../types/NormalizedPath';
import getAllConfigs from '../utils/getAllConfigs';
import Options from '../types/Options';
import { getFenceAndImportDiffsFromGit } from '../utils/getFenceAndImportDiffsFromGit';
import { getPartialCheckFromImportDiffs } from '../utils/getPartialCheckFromImportDiffs';
import { tick } from '../utils/tick';

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
            console.log(diffs);
            partialCheck = await getPartialCheckFromImportDiffs(diffs);
        } else {
            console.log('cannot perform partial check');
        }
        console.log('took', tick());
    }

    return partialCheck;
}

async function getAllFiles(): Promise<[SourceFileProvider, NormalizedPath[]]> {
    let options = getOptions();
    console.log('constructing source file provider...');
    let sourceFileProvider: SourceFileProvider = options.looseRootFileDiscovery
        ? new FDirSourceFileProvider(options.project, options.rootDir)
        : new TypeScriptProgram(options.project);
    console.log('took', tick());
    console.log(
        'instantiated provider',
        Object.getPrototypeOf(sourceFileProvider).constructor.name
    );
    console.log('fetching files..');
    let files = await sourceFileProvider.getSourceFiles();
    console.log('took', tick());
    console.log('normalizing paths...');
    const normalizedFiles = files.map(file => normalizePath(file));
    console.log('took', tick());
    return [sourceFileProvider, normalizedFiles];
}

export async function run(rawOptions: RawOptions) {
    console.log('storing options', tick());

    // Store options so they can be globally available
    setOptions(rawOptions);

    // const [[sourceFileProvider, normalizedFiles], partialCheck] = await Promise.all([
    //     getAllFiles(),
    //     getParitalCheck(),
    // ]);
    const partialCheck = await getParitalCheck();
    if (partialCheck && partialCheck.fences.length == 0 && partialCheck.sourceFiles.length == 0) {
        console.warn(
            'performing no validation with good-fences: no fences or source files have changed'
        );
        return getResult();
    }
    const [sourceFileProvider, normalizedFiles] = await getAllFiles();

    console.log('loading all fences...');
    getAllConfigs();
    console.log('took', tick());
    console.log('validating tags on all fences...');
    validateTagsExist();
    console.log('took', tick());

    console.log('performing validation...');
    if (partialCheck) {
        // validate only those files specified on the command line,
        // or included in the scope of changed fence files.
        const fenceScopeFiles = normalizedFiles.filter(normalizedFile =>
            getConfigsForFile(normalizedFile).some(config =>
                partialCheck.fences.includes(config.path)
            )
        );
        await batchRunAll(
            MAX_VALIDATION_BATCHSIZE,
            [...partialCheck.sourceFiles, ...fenceScopeFiles],
            (normalizedFile: NormalizedPath) => validateFile(normalizedFile, sourceFileProvider)
        );
    } else {
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
