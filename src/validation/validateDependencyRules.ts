import Config from '../types/config/Config';
import NormalizedPath from '../types/NormalizedPath';
import getConfigsForFile from '../utils/getConfigsForFile';
import reportError from '../core/reportError';
import ImportRecord from '../core/ImportRecord';
import fileHasNecessaryTag from '../utils/fileHasNecessaryTag';
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
    for (let dependencyRule of config.dependencies) {
        // Check whether:
        //   1) The import matches the rule
        //   2) If necessary, the source file has a relevant tag
        if (
            minimatch(importRecord.rawImport, dependencyRule.dependency) &&
            fileHasNecessaryTag(sourceFile, dependencyRule.accessibleTo)
        ) {
            // A rule matched, so the dependency is valid
            return;
        }
    }

    // If we made it here, we didn't find a rule that allows the dependency
    reportError('Dependency is not allowed', sourceFile, importRecord.rawImport, config);
}
