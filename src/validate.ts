import * as glob from 'glob';
import validateFile from './validateFile';

export default function validate() {
    let files = glob.sync('src/**/*.ts');
    files.forEach(validateFile);
}
