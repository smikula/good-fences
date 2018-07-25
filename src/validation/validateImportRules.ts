import * as path from 'path';
import Config from '../types/Config';
import NormalizedPath from '../types/NormalizedPath';
import getConfigsForFile from '../utils/getConfigsForFile';
import reportError from '../core/reportError';
import ImportRecord from '../core/ImportRecord';

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

    // If the import file is under the config (i.e. the source and import files share the
    // config) then we don't apply the import restriction
    if (!path.relative(config.path, importRecord.filePath).startsWith('..')) {
        return;
    }

    // In order for the the import to be valid, there needs to be some rule that allows it
    let importAllowed = false;
    for (let packageName of config.imports) {
        // For now we're only validating external dependencies
        if (!importRecord.isExternal) {
            importAllowed = true;
        }

        if (importRecord.packageName == packageName) {
            importAllowed = true;
        }
    }

    if (!importAllowed) {
        reportError(`${sourceFile} is not allowed to import '${importRecord.rawImport}'`);
    }
}
