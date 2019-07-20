import RawOptions from '../types/RawOptions';
import getOptions, { setOptions } from '../utils/getOptions';
import validateFile from '../validation/validateFile';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';
import { getErrors } from './reportError';

export function run(rawOptions: RawOptions) {
    // Store options so they can be globally available
    setOptions(rawOptions);

    // Warn when using a deprecated option
    if (getOptions().onError) {
        console.warn('The onError option is deprecated.  Use the return value from run() instead.');
    }

    // Run validation
    let tsProgram = new TypeScriptProgram(getOptions().project);
    let files = tsProgram.getSourceFiles();
    files.forEach(file => {
        validateFile(normalizePath(file), tsProgram);
    });

    return getErrors();
}
