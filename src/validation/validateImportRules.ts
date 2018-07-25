import Config from '../types/Config';
import NormalizedPath from '../types/NormalizedPath';
import getConfigsForFile from '../utils/getConfigsForFile';

export default function validateImportRules(
    sourceFile: NormalizedPath,
    importFile: NormalizedPath
) {
    // Validate against each config that applies to the imported file
    let configsForSource = getConfigsForFile(sourceFile);
    for (let config of configsForSource) {
        validateConfig(config, sourceFile, importFile);
    }
}

function validateConfig(config: Config, sourceFile: NormalizedPath, importFile: NormalizedPath) {}
