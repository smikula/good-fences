import * as glob from 'glob';
import validateFile from './validateFile';
import TypeScriptProgram from './TypeScriptProgram';

export function run() {
    let tsProgram = new TypeScriptProgram('tsconfig.build.json');
    let files = glob.sync('packages/**/*.ts');
    files.forEach(file => {
        validateFile(file, tsProgram);
    });
}
