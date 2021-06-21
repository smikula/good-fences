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

let lastUptime = 0;
function tick() {
    const now = process.uptime();
    const diff = now - lastUptime;
    lastUptime = now;
    return diff;
}

export async function run(rawOptions: RawOptions) {
    // Store options so they can be globally available
    setOptions(rawOptions);

    // Do some sanity checks on the fences
    validateTagsExist();

    // Run validation
    let options = getOptions();
    console.log('finished starting up in', tick());
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
    console.log('performing validation...');
    if (options.partialCheck) {
        // validate only those files specified on the command line,
        // or included in the scope of changed fence files.
        const fenceScopeFiles = normalizedFiles.filter(normalizedFile =>
            getConfigsForFile(normalizedFile).some(config =>
                options.partialCheck.fences.includes(config.path)
            )
        );
        await Promise.all(
            [...options.partialCheck.sourceFiles, ...fenceScopeFiles].map(normalizedFile => {
                validateFile(normalizedFile, sourceFileProvider);
            })
        );
    } else {
        // validate all files
        await Promise.all(
            normalizedFiles.map(normalizedFile => {
                validateFile(normalizedFile, sourceFileProvider);
            })
        );
    }
    console.log('took', tick());
    return getResult();
}
