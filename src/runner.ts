import * as glob from 'glob';
import validateFile from './validateFile';

export function run() {
    let files = glob.sync('src/**/*.ts');
    files.forEach(validateFile);
}
