import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import ConfigSet from './types/ConfigSet';
import getOptions from './getOptions';

let configSet: ConfigSet = null;

export default function getAllConfigs(): ConfigSet {
    if (!configSet) {
        configSet = {};

        // Glob for configs under the project root directory
        let globString = '**/fence.json';
        if (getOptions().rootDir) {
            globString = path.resolve(getOptions().rootDir, globString);
        }

        let files = glob.sync(globString);
        files.forEach(file => {
            let absolutePath = path.resolve(path.dirname(file));
            configSet[absolutePath] = JSON.parse(fs.readFileSync(file).toString());
            configSet[absolutePath].path = absolutePath;
        });
    }

    return configSet;
}
