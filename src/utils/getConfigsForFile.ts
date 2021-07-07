import * as path from 'path';
import Config from '../types/config/Config';
import NormalizedPath from '../types/NormalizedPath';
import normalizePath from './normalizePath';
import getConfigManager from './getConfigManager';

export function getConfigPathCandidatesForFile(filePath: NormalizedPath): string[] {
    const candidates: string[] = [];

    let pathSegments = normalizePath(path.dirname(filePath)).split(path.sep);
    while (pathSegments.length) {
        let dirPath = pathSegments.join(path.sep);
        candidates.push(dirPath);
        pathSegments.pop();
    }

    return candidates;
}

// Returns an array of all the configs that apply to a given file
export default function getConfigsForFile(filePath: NormalizedPath): Config[] {
    const partialFenceSet = getConfigManager().partialConfigSetForPath(filePath);

    return Object.entries(partialFenceSet).map(([_configPath, config]) => config);
}
