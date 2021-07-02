import * as path from 'path';
import Config from '../types/config/Config';
import NormalizedPath from '../types/NormalizedPath';
import getConfigsForFile from '../utils/getConfigsForFile';
import fileMatchesConfigGlob from '../utils/fileMatchesConfigGlob';
import fileHasNecessaryTag from '../utils/fileHasNecessaryTag';
import { reportViolation } from '../core/result';
import ImportRecord from '../core/ImportRecord';

export default function validateExportRules(
    sourceFile: NormalizedPath,
    importRecord: ImportRecord
) {
    // Validate against each config that applies to the imported file
    let configsForImport = getConfigsForFile(importRecord.filePath);
    configsForImport.forEach(config => validateConfig(config, sourceFile, importRecord));
}

function validateConfig(config: Config, sourceFile: NormalizedPath, importRecord: ImportRecord) {
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
    if (hasMatchingExport(config, sourceFile, importRecord.filePath)) {
        return;
    }

    console.log('ERR validateExportConfig', config, sourceFile, importRecord);

    // If we made it here, the import is invalid
    reportViolation('Module is not exported', sourceFile, importRecord, config);
}

function hasMatchingExport(config: Config, sourceFile: NormalizedPath, importFile: NormalizedPath) {
    let isExported = false;
    for (const exportRule of config.exports) {
        if (
            fileMatchesConfigGlob(importFile, config.path, exportRule.modules) &&
            fileHasNecessaryTag(sourceFile, exportRule.accessibleTo)
        ) {
            isExported = true;
        }
    }

    return isExported;
}
