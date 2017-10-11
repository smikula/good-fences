import * as path from 'path';

export default function fileMatchesConfigGlob(importFile: string, configPath: string, key: string) {
    // Remove the file extension before matching
    importFile = importFile.substr(0, importFile.length - path.extname(importFile).length);
    return path.resolve(configPath, key) == importFile;
}
