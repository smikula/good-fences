import * as path from 'path';
import NormalizedPath from '../types/NormalizedPath';
import normalizePath from './normalizePath';
const minimatch = require('minimatch');

export default function fileMatchesConfigGlob(
    importFile: NormalizedPath,
    configPath: NormalizedPath,
    modulesGlob: string
) {
    // '*' matches all files under the config
    if (modulesGlob == '*') {
        return true;
    }

    // Remove the file extension before matching
    importFile = removeFileExtension(importFile);
    return minimatch(importFile, normalizePath(configPath, modulesGlob));
}

function removeFileExtension(filePath: NormalizedPath): NormalizedPath {
    // Special case for .d.ts files
    let extension = filePath.endsWith('.d.ts') ? '.d.ts' : path.extname(filePath);
    return <NormalizedPath>filePath.slice(0, -extension.length);
}
