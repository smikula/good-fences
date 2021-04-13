import * as fs from 'fs';
import * as path from 'path';
import ConfigSet from '../types/ConfigSet';
import getOptions from './getOptions';
import loadConfig from './loadConfig';

let configSet: ConfigSet = null;

export default function getAllConfigs(): ConfigSet {
    if (!configSet) {
        configSet = {};

        let files: string[] = [];
        const rootDirOption = getOptions().rootDir;
        const rootDirs: string[] = Array.isArray(rootDirOption) ? rootDirOption : [rootDirOption];
        for (let rootDir of rootDirs) {
            accumulateFences(rootDir, files, getOptions().ignoreExternalFences);
        }

        files.forEach(file => {
            loadConfig(file, configSet);
        });
    }

    return configSet;
}

function accumulateFences(dir: string, files: string[], ignoreExternalFences: boolean) {
    const directoryEntries: fs.Dirent[] = fs.readdirSync(dir, { withFileTypes: true });
    for (const directoryEntry of directoryEntries) {
        const fullPath = path.join(dir, directoryEntry.name);
        if (directoryEntry.name == 'fence.json') {
            files.push(fullPath);
        } else if (
            directoryEntry.isDirectory() &&
            !(ignoreExternalFences && directoryEntry.name == 'node_modules')
        ) {
            accumulateFences(fullPath, files, ignoreExternalFences);
        }
    }
}
