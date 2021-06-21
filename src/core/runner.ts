import RawOptions from '../types/RawOptions';
import getOptions, { setOptions } from '../utils/getOptions';
import validateFile from '../validation/validateFile';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';
import { getResult } from './result';
import { validateTagsExist } from '../validation/validateTagsExist';
import getConfigsForFile from '../utils/getConfigsForFile';

export function run(rawOptions: RawOptions) {
    // Store options so they can be globally available
    setOptions(rawOptions);

    // Do some sanity checks on the fences
    validateTagsExist();

    // Run validation
    let options = getOptions();
    console.log('constructing program...', process.uptime());
    let tsProgram = new TypeScriptProgram(options.project);
    console.log('fetching files..', process.uptime());
    let files = tsProgram.getSourceFiles();
    console.log('normalizing paths...', process.uptime());
    const normalizedFiles = files.map(file => normalizePath(file));
    console.log('performing validation...', process.uptime());
    if (options.partialCheck) {
        // validate only those files specified on the command line,
        // or included in the scope of changed fence files.
        const fenceScopeFiles = normalizedFiles.filter(normalizedFile =>
            getConfigsForFile(normalizedFile).some(config =>
                options.partialCheck.fences.includes(config.path)
            )
        );
        [...options.partialCheck.sourceFiles, ...fenceScopeFiles].forEach(normalizedFile => {
            validateFile(normalizedFile, tsProgram);
        });
    } else {
        // validate all files
        normalizedFiles.forEach(normalizedFile => {
            validateFile(normalizedFile, tsProgram);
        });
    }
    console.log('getting result..', process.uptime());
    return getResult();
}
