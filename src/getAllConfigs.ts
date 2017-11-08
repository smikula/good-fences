import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import ConfigSet from './types/ConfigSet';
import normalizePath from './normalizePath';
import getOptions from './getOptions';

let configSet: ConfigSet = null;

export default function getAllConfigs(): ConfigSet {
    if (!configSet) {
        configSet = {};

        // Glob for configs under the project root directory
        let files = glob.sync(normalizePath(getOptions().rootDir, '**/fence.json'));
        files.forEach(file => {
            let configPath = normalizePath(path.dirname(file));
            configSet[configPath] = JSON.parse(fs.readFileSync(file).toString());
            configSet[configPath].path = configPath;
        });
    }

    return configSet;
}
