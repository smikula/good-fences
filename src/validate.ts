import * as glob from 'glob';

export default function validate() {
    let files = glob.sync('src/**/*.ts');
    files.forEach(file => {
        console.log(file);
    });
}
