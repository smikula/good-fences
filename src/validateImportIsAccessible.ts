import * as path from 'path';
import getConfigsForFile from './getConfigsForFile';
import reportError from './reportError';

export default function validateImportIsAccessible(sourceFile: string, importFile: string) {
    let configsForImport = getConfigsForFile(importFile);
    let isExported = false;
    let foundUnsharedConfig = false;

    // Make sure we're using absolute paths
    sourceFile = path.resolve(sourceFile);
    importFile = path.resolve(importFile);

    // Process each config that applies to the imported file
    configsForImport.forEach(config => {
        // If the config is shared between source file and import then the export rules don't apply
        if (path.relative(config.path, sourceFile).startsWith('..')) {
            foundUnsharedConfig = true;

            // Examine each export specified in the config
            if (config.exports) {
                Object.keys(config.exports).forEach(key => {
                    let value = config.exports[key];

                    if (
                        keyMatchesImportFile(config.path, key, importFile) &&
                        valueMatchesSourceFile(value, sourceFile)
                    ) {
                        isExported = true;
                    }
                });
            }
        }
    });

    // If there is no unshared config (i.e. both files are under the same subtree of every config
    // above them) then the import is valid by default.  Otherwise we need to make sure that it
    // was exported.
    if (foundUnsharedConfig && !isExported) {
        reportError(`${sourceFile} is not allowed to import ${importFile}`);
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
