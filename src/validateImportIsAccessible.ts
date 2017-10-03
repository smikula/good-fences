import * as path from 'path';
import Config from './types/Config';
import getConfigsForFile from './getConfigsForFile';
import reportError from './reportError';

export default function validateImportIsAccessible(sourceFile: string, importFile: string) {
    // Make sure we're using absolute paths
    sourceFile = path.resolve(sourceFile);
    importFile = path.resolve(importFile);

    // Validate against each config that applies to the imported file
    let configsForImport = getConfigsForFile(importFile);
    configsForImport.forEach(config => validateConfig(config, sourceFile, importFile));
}

function validateConfig(config: Config, sourceFile: string, importFile: string) {
    // If the source file is under the config (i.e. the source and import files share the
    // config) then we don't apply the export rules
    if (!path.relative(config.path, sourceFile).startsWith('..')) {
        return;
    }

    // If the config doesn't specify exports then everything is considered public
    if (!config.exports) {
        return;
    }

    // See if the config has an export rule that matches
    if (hasMatchingExport(config, sourceFile, importFile)) {
        return;
    }

    // If we made it here, the import is invalid
    reportError(`${sourceFile} is importing inaccessible module ${importFile}`);
}

function hasMatchingExport(config: Config, sourceFile: string, importFile: string) {
    let isExported = false;
    Object.keys(config.exports).forEach(key => {
        let value = config.exports[key];

        if (
            keyMatchesImportFile(config.path, key, importFile) &&
            valueMatchesSourceFile(value, sourceFile)
        ) {
            isExported = true;
        }
    });

    return isExported;
}

function keyMatchesImportFile(configPath: string, key: string, importFile: string) {
    // Remove the file extension before matching
    importFile = importFile.substr(0, importFile.length - path.extname(importFile).length);
    return path.resolve(configPath, key) == importFile;
}

function valueMatchesSourceFile(value: string | string[], sourceFile: string) {
    return value == '*';
}
