import validateFile from './validateFile';
import TypeScriptProgram from './TypeScriptProgram';

export function run() {
    let tsProgram = new TypeScriptProgram('tsconfig.build.json');
    let files = tsProgram.getSourceFiles();
    files.forEach(file => {
        validateFile(file, tsProgram);
    });
}
