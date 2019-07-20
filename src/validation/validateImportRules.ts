import * as path from 'path';
import Config from '../types/config/Config';
import NormalizedPath from '../types/NormalizedPath';
import getConfigsForFile from '../utils/getConfigsForFile';
import { reportError } from '../core/result';
import ImportRecord from '../core/ImportRecord';
import getTagsForFile from '../utils/getTagsForFile';

export default function validateImportRules(
    sourceFile: NormalizedPath,
    importRecord: ImportRecord
) {
    // Validate against each config that applies to the imported file
    let configsForSource = getConfigsForFile(sourceFile);
    for (let config of configsForSource) {
        validateConfig(config, sourceFile, importRecord);
    }
}

function validateConfig(config: Config, sourceFile: NormalizedPath, importRecord: ImportRecord) {
    // If the config doesn't specify imports then all imports are allowed
    if (!config.imports) {
        return;
    }

    // If the source file is under the config (i.e. the source and import files share the
    // config) then we don't apply the import rules
    if (!path.relative(config.path, importRecord.filePath).startsWith('..')) {
        return;
    }

    // For the the import to be valid, one of its tags needs to match one of the allowed tags
    let importTags = getTagsForFile(importRecord.filePath);
    for (let tag of config.imports) {
        if (importTags.indexOf(tag) != -1) {
            // A tag matched, so the import is valid
            return;
        }
    }

    // If we made it here, the import is invalid
    reportError('Import not allowed', sourceFile, importRecord.rawImport, config);
}
