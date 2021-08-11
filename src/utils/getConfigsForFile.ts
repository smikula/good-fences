import Config from '../types/config/Config';
import NormalizedPath from '../types/NormalizedPath';
import getConfigManager from './getConfigManager';

// Returns an array of all the configs that apply to a given file
export default function getConfigsForFile(filePath: NormalizedPath): Config[] {
    const partialFenceSet = getConfigManager().getPartialConfigSetForPath(filePath);

    return Object.entries(partialFenceSet).map(([_configPath, config]) => config);
}
