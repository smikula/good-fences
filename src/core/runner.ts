import RawOptions from '../types/RawOptions';
import getOptions, { setOptions } from '../utils/getOptions';
import validateFile from '../validation/validateFile';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';
import { getResult } from './result';
import { validateTagsExist } from '../validation/validateTagsExist';
import { SourceFileProvider } from './SourceFileProvider';
import { FDirSourceFileProvider } from './FdirSourceFileProvider';
import NormalizedPath from '../types/NormalizedPath';
import { runWithConcurrentLimit } from '../utils/runWithConcurrentLimit';

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

    let sourceFileProvider: SourceFileProvider = options.looseRootFileDiscovery
        ? new FDirSourceFileProvider(options.project, options.rootDir)
        : new TypeScriptProgram(options.project);

    // Do some sanity checks on the fences
    validateTagsExist();

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

    return getResult();
}
