import * as path from 'path';
import NormalizedPath from './types/NormalizedPath';
import createPath from './createPath';
const minimatch = require('minimatch');

export default function fileMatchesConfigGlob(
    importFile: NormalizedPath,
    configPath: NormalizedPath,
    key: string
) {
    // '*' matches all files under the config
    if (key == '*') {
        return true;
    }

    // Remove the file extension before matching
    importFile = <NormalizedPath>importFile.substr(
        0,
        importFile.length - path.extname(importFile).length
    );
    return minimatch(importFile, createPath(configPath, key));
}
