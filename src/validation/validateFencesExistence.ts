import reportError from '../core/reportError';
import * as glob from 'glob';
import * as path from 'path';
import getAllConfigs from '../utils/getAllConfigs';
import Config from '../types/Config';
import ConfigSet from '../types/ConfigSet';
import dedupe from '../utils/dedupe';

interface ConfigPathPair {
    path: string;
    config: Config;
}

export default function validateFencesExistence() {
    const configPathMap = getAllConfigs();
    const requiredFenceGlobs = getRequiredFenceGlobs(configPathMap);

    // get a deduped list of required paths
    const requiredPaths = dedupe(requiredFenceGlobs.map(f => glob.sync(f)));

    // get the required paths that aren't in our map of all configs
    const missingRequiredPaths = requiredPaths.filter(p => !configPathMap[p]);

    if (missingRequiredPaths.length > 0) {
        missingRequiredPaths.forEach(p => reportError(`Missing fence.json at ${p}`));
    }

    return missingRequiredPaths.length === 0;
}

/**
 * @summary Create a set of globs that define directories that must have fences
 * @param configSet The set of configs to build our globs from
 */
function getRequiredFenceGlobs(configSet: ConfigSet) {
    const configPathPairs = Object.keys(configSet).map(key => ({
        path: key,
        config: configSet[key],
    }));

    const configPathPairsWithFences = configPathPairs.filter(pair => pair.config.requiredFences);

    const requiredFenceGlobs = configPathPairsWithFences
        .map(absolutifyGlobs)
        .map(directorizeGlobs)
        .reduce((acc, e) => acc.concat(e), []);

    return requiredFenceGlobs;
}

/**
 * @summary Create globs with absolute paths
 * @param pair A pair of base path and config
 */
function absolutifyGlobs(pair: ConfigPathPair) {
    const pathParts = pair.path.split(/[\///]/);
    const requiredFences = pair.config.requiredFences;
    const absoluteGlobs = requiredFences.map(rf =>
        pathParts.concat(rf.split(/[\///]/)).join(path.sep)
    );

    return absoluteGlobs;
}

/**
 * @summary ensure we only match directories by appending a path separator (e.g.  '/')
 * @param globs The globs to directorize
 */
function directorizeGlobs(globs: string[]) {
    const dirPaths = globs.map(g => g.replace(/[\///]*$/, path.sep));
    return dirPaths;
}
