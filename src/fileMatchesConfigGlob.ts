import * as path from 'path';
import Path from './types/Path';
const minimatch = require('minimatch');

export default function fileMatchesConfigGlob(importFile: Path, configPath: Path, key: string) {
    // '*' matches all files under the config
    if (key == '*') {
        return true;
    }

    // Remove the file extension before matching
    importFile = <Path>importFile.substr(0, importFile.length - path.extname(importFile).length);
    return minimatch(importFile, path.resolve(configPath, key));
}
