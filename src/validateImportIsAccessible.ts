import * as path from 'path';
import getConfig from './getConfig';

export default function validateImportIsAccessible(sourceFile: string, importFile: string) {
    let allConfigs = getConfig();
    let isExported = false;
    let foundUnsharedConfig = false;

    // Make sure we're using absolute paths
    sourceFile = path.resolve(sourceFile);
    importFile = path.resolve(importFile);

    // Starting at import file's path, walk up the directory structure
    let configPathSegments = path.resolve(path.dirname(importFile)).split(path.sep);
    while (configPathSegments.length) {
        let configPath = configPathSegments.join(path.sep);
        configPathSegments.pop();

        // If there's no config file at this level, there's nothing to validate
        let config = allConfigs[configPath];
        if (!config) {
            continue;
        }

        // If the config is shared between source file and import then the export rules don't apply
        if (path.relative(configPath, sourceFile).startsWith('..')) {
            foundUnsharedConfig = true;

            // Examine each export specified in the config
            if (config.exports) {
                Object.keys(config.exports).forEach(key => {
                    let value = config.exports[key];

                    if (
                        keyMatchesImportFile(configPath, key, importFile) &&
                        valueMatchesSourceFile(value, sourceFile)
                    ) {
                        isExported = true;
                    }
                });
            }
        }
    }

    // If there is no unshared config (i.e. both files are under the same subtree of every config
    // above them) then the import is valid by default.  Otherwise we need to make sure that it
    // was exported.
    if (foundUnsharedConfig && !isExported) {
        console.error(`Error: ${sourceFile} is not allowed to import ${importFile}`);
    }
}

function keyMatchesImportFile(configPath: string, key: string, importFile: string) {
    // Remove the file extension before matching
    importFile = importFile.substr(0, importFile.length - path.extname(importFile).length);
    return path.resolve(configPath, key) == importFile;
}

function valueMatchesSourceFile(value: string | string[], sourceFile: string) {
    return value == '*';
}
