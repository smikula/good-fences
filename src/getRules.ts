import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import RuleSet from './types/RuleSet';

let ruleSet: RuleSet = null;

export default function getRules(): RuleSet {
    if (!ruleSet) {
        ruleSet = {};

        let files = glob.sync('**/depcop.json');
        files.forEach(file => {
            let absolutePath = path.resolve(path.dirname(file));
            ruleSet[absolutePath] = JSON.parse(fs.readFileSync(file).toString());
        });
    }

    return ruleSet;
}
