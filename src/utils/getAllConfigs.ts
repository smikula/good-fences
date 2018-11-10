import * as glob from 'glob';
import * as path from 'path';
import ConfigSet from '../types/ConfigSet';
import normalizePath from './normalizePath';
import getOptions from './getOptions';
import loadConfig from './loadConfig';

let configSet: ConfigSet = null;

export default function getAllConfigs(): ConfigSet {
    if (!configSet) {
        configSet = {};

        // Glob for configs under the project root directory
        let files = glob.sync(normalizePath(getOptions().rootDir, '**/fence.json'));

        // If necessary, filter out external fences
        if (getOptions().ignoreExternalFences) {
            files = files.filter(f => f.split(path.sep).indexOf('node_modules') > -1);
        }

        files.forEach(file => {
            let config = loadConfig(file);
            configSet[config.path] = config;
        });
    }

    return configSet;
}
