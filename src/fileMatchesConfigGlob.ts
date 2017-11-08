import * as path from 'path';
import Path from './types/Path';
import createPath from './createPath';
const minimatch = require('minimatch');

export default function fileMatchesConfigGlob(importFile: Path, configPath: Path, key: string) {
    // '*' matches all files under the config
    if (key == '*') {
        return true;
    }

    // Remove the file extension before matching
    importFile = <Path>importFile.substr(0, importFile.length - path.extname(importFile).length);
    console.log('importFile', importFile);
    console.log('createPath(configPath, key)', createPath(configPath, key));
    return minimatch(importFile, createPath(configPath, key));
}
