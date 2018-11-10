import reportError from '../core/reportError';
import * as glob from 'glob';
import * as path from 'path';
import getAllConfigs from '../utils/getAllConfigs';
import Config from '../types/config/Config';
import ConfigSet from '../types/ConfigSet';

interface ConfigPathPair {
    path: string;
    config: Config;
}

interface RequiredFenceGlobInfo {
    configPath: string;
    requiredFenceGlob: string;
}

interface RequiredFence {
    requiredPath: string;
    configPath: string;
}

interface RequiredFenceMap {
    [index: string]: RequiredFence[];
}


export default function validateRequiredFences() {
    const configPathMap = getAllConfigs();
    const requiredFencePairs = getRequiredFenceGlobs(configPathMap);
    
    // create a map from (requiredFence) => configsWithRequirement[]
    const requiredFenceMap = getRequiredFenceMap(requiredFencePairs);

    // get the required paths that aren't in our map of all configs
    const missingRequiredPaths = Object.keys(requiredFenceMap).filter(rf => !configPathMap[rf]);

    if (missingRequiredPaths.length > 0) {
        missingRequiredPaths.map(p => ({key: p, values: requiredFenceMap[p]})).forEach(kvp => {
            const missingFencePath = kvp.key;
            const configs = kvp.values;
            const firstConfigKey = configs[0].configPath;
            reportError('Missing required fence.json', missingFencePath, missingFencePath, configPathMap[firstConfigKey]);
        });
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
function absolutifyGlobs(pair: ConfigPathPair): RequiredFenceGlobInfo[] {
    const pathParts = pair.path.split(/[\///]/);
    const requiredFences = pair.config.requiredFences;
    const absoluteGlobs = requiredFences.map(rf =>
        ({configPath: pair.path, requiredFenceGlob: pathParts.concat(rf.split(/[\///]/)).join(path.sep)})
    );

    return absoluteGlobs;
}

/**
 * @summary ensure we only match directories by appending a path separator (e.g.  '/')
 * @param globs The globs to directorize
 */
function directorizeGlobs(globs: RequiredFenceGlobInfo[]): RequiredFenceGlobInfo[] {
    const dirGlobs = globs.map(g => ({...g, requiredFenceGlob: g.requiredFenceGlob.replace(/[\///]*$/, path.sep)}));
    return dirGlobs;
}

/**
 * @summary Get a map from each directory that must have a fence, to all of the configs
 * that require that directory to have a fence
 * @param globs The globs that define which directories must have fences
 */
function getRequiredFenceMap(globs: RequiredFenceGlobInfo[]): RequiredFenceMap {
    const globsWithMatchedPaths = globs.map(g => ({...g, requiredFencePaths: glob.sync(g.requiredFenceGlob)}));
    const requiredPaths = globsWithMatchedPaths.map(g => g.requiredFencePaths.map(p => ({requiredPath: p, configPath: g.configPath})));
    const flattenedRequiredPaths = ([] as RequiredFence[]).concat(...requiredPaths)
    const mergedRequiredPaths = index(flattenedRequiredPaths, obj => obj.requiredPath);
    
    return mergedRequiredPaths;
}

/**
 * @summary Build an index from a collection of objects
 * @param objects The objects to index
 * @param getKey A function that chooses index keys
 */
function index<T extends {[index: string | number]: any}>(objects: T[], getKey: (obj: T) => string)  {
    return objects.reduce((acc, e) => {
        const key = getKey(e);
        return {
        ...acc,
        [key]: [...acc[key], e]
    };
}, {} as {[index: string]: T[]});
}