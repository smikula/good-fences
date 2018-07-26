import Config from '../types/Config';
import NormalizedPath from '../types/NormalizedPath';
import getConfigsForFile from '../utils/getConfigsForFile';
import reportError from '../core/reportError';
import ImportRecord from '../core/ImportRecord';
const minimatch = require('minimatch');

export default function validateDependencyRules(
    sourceFile: NormalizedPath,
    importRecord: ImportRecord
) {
    // If the import is not an external dependency then these rules do not apply
    if (!importRecord.isExternal) {
        return;
    }

    // Validate against each config that applies to the imported file
    let configsForSource = getConfigsForFile(sourceFile);
    for (let config of configsForSource) {
        validateConfig(config, sourceFile, importRecord);
    }
}

function validateConfig(config: Config, sourceFile: NormalizedPath, importRecord: ImportRecord) {
    // If the config doesn't specify dependencies then all dependencies are allowed
    if (!config.dependencies) {
        return;
    }

    // In order for the the import to be valid, there needs to be some rule that allows it
    let importAllowed = false;
    for (let dependencyPattern of config.dependencies) {
        if (minimatch(importRecord.rawImport, dependencyPattern)) {
            importAllowed = true;
        }
    }

    if (!importAllowed) {
        reportError(`${sourceFile} is not allowed to import '${importRecord.rawImport}'`);
    }
}
