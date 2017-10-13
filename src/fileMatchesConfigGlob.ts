import * as path from 'path';
const minimatch = require('minimatch');

export default function fileMatchesConfigGlob(importFile: string, configPath: string, key: string) {
    // '*' matches all files under the config
    if (key == '*') {
        return true;
    }

    // Remove the file extension before matching
    importFile = importFile.substr(0, importFile.length - path.extname(importFile).length);
    return minimatch(importFile, path.resolve(configPath, key));
}
