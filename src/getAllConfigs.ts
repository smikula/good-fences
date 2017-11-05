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
        let files = glob.sync(path.resolve(getOptions().rootDir, '**/fence.json'));
        files.forEach(file => {
            let absolutePath = path.resolve(path.dirname(file));
            configSet[absolutePath] = JSON.parse(fs.readFileSync(file).toString());
            configSet[absolutePath].path = absolutePath;
        });
    }

    return configSet;
}
