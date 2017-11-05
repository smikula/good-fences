import Options from './types/Options';
import getOptions, { setOptions } from './getOptions';
import validateFile from './validateFile';
import TypeScriptProgram from './TypeScriptProgram';

export function run(options: Options) {
    // Store options so they can be globally available
    setOptions(options);

    // Run validation
    let tsProgram = new TypeScriptProgram(getOptions().project);
    let files = tsProgram.getSourceFiles();
    files.forEach(file => {
        validateFile(file, tsProgram);
    });
}
