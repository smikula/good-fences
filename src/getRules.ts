import * as fs from 'fs';
import * as glob from 'glob';
import RuleSet from './types/RuleSet';

let ruleSet: RuleSet = null;

export default function getRules(): RuleSet {
    if (!ruleSet) {
        ruleSet = {};

        let files = glob.sync('**/depcop.json');
        files.forEach(file => {
            ruleSet[file] = JSON.parse(fs.readFileSync(file).toString());
        });
    }

    return ruleSet;
}
