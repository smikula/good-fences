import * as fs from 'fs';
import * as path from 'path';
import ConfigSet from '../types/ConfigSet';
import getOptions from './getOptions';
import loadConfig from './loadConfig';
import { getConfigPathCandidatesForFile } from './getConfigPathCandidatesForFile';
import NormalizedPath from '../types/NormalizedPath';

class ConfigManager {
    private fullConfigSet: ConfigSet = null;
    // The subset of configs that has been loaded
    private partialDiscoveredConfigs: ConfigSet = {};

    // The set of paths we have checked for configs in the filesystem
    private discoveredPaths: Set<string> = new Set();

    public getAllConfigs(): ConfigSet {
        if (this.fullConfigSet === null) {
            this._getAllConfigs();
        }
        return this.fullConfigSet;
    }

    public getPartialConfigSetForPath(configSourcePath: NormalizedPath): ConfigSet {
        const partialSet: ConfigSet = {};

        const configCandidatesForFile = getConfigPathCandidatesForFile(configSourcePath);

        if (this.fullConfigSet) {
            // If the full config set has been initialized (e.g. by calling cfgManager.getAllConfigs)
            // then instead of doing redundant fs access, construct the result from the full config
            // set
            for (let configPathCandidate of configCandidatesForFile) {
                if (this.fullConfigSet[configPathCandidate]) {
                    partialSet[configPathCandidate] = this.fullConfigSet[configPathCandidate];
                }
            }
        } else {
            // If the full config set has not been initialized, go to disk to find configs in the
            // candidate set.
            //
            // As we scan paths, we add them to our partial configs and our set of checked paths
            // so we can avoid redudnant fs access for this same fence and path in the future.
            for (let configPathCandidate of configCandidatesForFile) {
                const configPathCandidateFull = path.join(configPathCandidate, 'fence.json');
                if (this.discoveredPaths.has(configPathCandidateFull)) {
                    const discoveredConfig = this.partialDiscoveredConfigs[configPathCandidate];
                    if (discoveredConfig) {
                        partialSet[configPathCandidateFull] = discoveredConfig;
                    }
                } else {
                    try {
                        const stat = fs.statSync(configPathCandidateFull);
                        if (stat?.isFile()) {
                            loadConfig(configPathCandidateFull, partialSet);
                        }
                    } catch {
                        // pass e.g. for ENOENT
                    }
                    this.discoveredPaths.add(configPathCandidateFull);
                }
            }
            Object.assign(this.partialDiscoveredConfigs, partialSet);
        }

        return partialSet;
    }

    private _getAllConfigs() {
        this.fullConfigSet = {};

        let files: string[] = [];
        for (let rootDir of getOptions().rootDir) {
            accumulateFences(rootDir, files, getOptions().ignoreExternalFences);
        }

        files.forEach(file => {
            loadConfig(file, this.fullConfigSet);
        });
    }
}

let configManager: ConfigManager | null = null;
export default function getConfigManager(): ConfigManager {
    if (!configManager) {
        configManager = new ConfigManager();
    }
    return configManager;
}

function accumulateFences(dir: string, files: string[], ignoreExternalFences: boolean) {
    const directoryEntries: fs.Dirent[] = fs.readdirSync(dir, { withFileTypes: true });
    for (const directoryEntry of directoryEntries) {
        const fullPath = path.join(dir, directoryEntry.name);
        if (directoryEntry.name == 'fence.json') {
            files.push(fullPath);
        } else if (
            directoryEntry.isDirectory() &&
            !(ignoreExternalFences && directoryEntry.name == 'node_modules')
        ) {
            accumulateFences(fullPath, files, ignoreExternalFences);
        }
    }
}
