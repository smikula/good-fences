import * as path from 'path';
import Config from './types/Config';
import Path from './types/Path';
import getConfigsForFile from './getConfigsForFile';
import fileMatchesConfigGlob from './fileMatchesConfigGlob';
import fileMatchesTag from './fileMatchesTag';
import reportError from './reportError';

export default function validateImportIsAccessible(sourceFile: Path, importFile: Path) {
    // Validate against each config that applies to the imported file
    let configsForImport = getConfigsForFile(importFile);
    configsForImport.forEach(config => validateConfig(config, sourceFile, importFile));
}

function validateConfig(config: Config, sourceFile: Path, importFile: Path) {
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

function hasMatchingExport(config: Config, sourceFile: Path, importFile: Path) {
    let isExported = false;
    Object.keys(config.exports).forEach(key => {
        let tags = config.exports[key];

        if (
            fileMatchesConfigGlob(importFile, config.path, key) &&
            fileMatchesTag(sourceFile, tags)
        ) {
            isExported = true;
        }
    });

    return isExported;
}
