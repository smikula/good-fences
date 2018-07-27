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

    // In order for the the dependency to be valid, there needs to be some rule that allows it
    for (let dependencyPattern of config.dependencies) {
        if (minimatch(importRecord.rawImport, dependencyPattern)) {
            // A rule matched, so the dependency is valid
            return;
        }
    }

    // If we made it here, the dependency is invalid
    reportError(`${sourceFile} is not allowed to import '${importRecord.rawImport}'`);
}
