import Options from './types/Options';
import validateFile from './validateFile';
import TypeScriptProgram from './TypeScriptProgram';

export function run(options: Options) {
    const project = options.project || 'tsconfig.json';
    let tsProgram = new TypeScriptProgram(project);
    let files = tsProgram.getSourceFiles();
    files.forEach(file => {
        validateFile(file, tsProgram);
    });
}
