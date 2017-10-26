import Options from './types/Options';
import { setErrorReporter } from './reportError';
import validateFile from './validateFile';
import TypeScriptProgram from './TypeScriptProgram';

export function run(options: Options) {
    // Apply options
    const project = options.project || 'tsconfig.json';
    if (options.onError) {
        setErrorReporter(options.onError);
    }

    // Run validation
    let tsProgram = new TypeScriptProgram(project);
    let files = tsProgram.getSourceFiles();
    files.forEach(file => {
        validateFile(file, tsProgram);
    });
}
