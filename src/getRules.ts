import * as fs from 'fs';
import * as glob from 'glob';

export default function getRules() {
    let files = glob.sync('**/depcop.json');
    let rules = {};

    files.forEach(file => {
        rules[file] = JSON.parse(fs.readFileSync(file).toString());
    });

    return rules;
}
