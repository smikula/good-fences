import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import ConfigSet from './types/ConfigSet';

let configSet: ConfigSet = null;

export default function getConfig(): ConfigSet {
    if (!configSet) {
        configSet = {};

        let files = glob.sync('**/depcop.json');
        files.forEach(file => {
            let absolutePath = path.resolve(path.dirname(file));
            configSet[absolutePath] = JSON.parse(fs.readFileSync(file).toString());
        });
    }

    return configSet;
}
