import * as fs from 'fs';
import * as path from 'path';
import ConfigSet from '../types/ConfigSet';
import getOptions from './getOptions';
import loadConfig from './loadConfig';
import { getConfigPathCandidatesForFile } from './getConfigsForFile';
import NormalizedPath from '../types/NormalizedPath';

class ConfigManager {
    private configSet: ConfigSet = null;
    // The subset of configs that has been loaded
    private partialDiscoveredConfigs: ConfigSet = {};
    // The set of paths we have checked for configs in the filesystem
    private discoveredPaths: Set<string> = new Set();

    public get all(): ConfigSet {
        if (this.configSet === null) {
            this._getAllConfigs();
        }
        return this.configSet;
    }

    public partialConfigSetForPath(configSourcePath: NormalizedPath): ConfigSet {
        const partialSet: ConfigSet = {};

        if (this.configSet) {
            for (let configPathCandidate of getConfigPathCandidatesForFile(configSourcePath)) {
                if (this.configSet[configPathCandidate]) {
                    partialSet[configPathCandidate] = this.configSet[configPathCandidate];
                }
            }
        } else {
            for (let configPathCandidate of getConfigPathCandidatesForFile(configSourcePath)) {
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
        this.configSet = {};

        let files: string[] = [];
        for (let rootDir of getOptions().rootDir) {
            accumulateFences(rootDir, files, getOptions().ignoreExternalFences);
        }

        files.forEach(file => {
            loadConfig(file, this.configSet);
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
