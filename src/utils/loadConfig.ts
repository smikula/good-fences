import * as fs from 'fs';
import * as path from 'path';
import RawConfig from '../types/rawConfig/RawConfig';
import Config from '../types/config/Config';
import normalizePath from './normalizePath';
import RawDependencyRule from '../types/rawConfig/RawDependencyRule';
import RawExportRule from '../types/rawConfig/RawExportRule';
import RawTagRule from '../types/rawConfig/RawTagRule';
import ConfigSet from '../types/ConfigSet';
import ExportRule from '../types/config/ExportRule';
import TagRule from '../types/config/TagRule';
import validateRawConfig from '../validation/validateRawConfig';

export default function loadConfig(file: string, configSet: ConfigSet) {
    // Load the raw config
    let rawConfig: RawConfig = JSON.parse(fs.readFileSync(file).toString());

    // Validate it
    const configPath = normalizePath(path.dirname(file));
    if (validateRawConfig(rawConfig, configPath)) {
        // Normalize it
        const config: Config = {
            path: configPath,
            tags: normalizeTagRules(rawConfig.tags),
            exports: normalizeExportRules(rawConfig.exports),
            dependencies: normalizeDependencyRules(rawConfig.dependencies),
            imports: rawConfig.imports,
        };

        // Add it to the config set
        configSet[config.path] = config;
    }
}

function normalizeDependencyRules(rules: RawDependencyRule[]) {
    if (!rules) {
        return null;
    }

    return rules.map(dependency => {
        // Upgrade simple strings to DependencyRule structs
        if (typeof dependency == 'string') {
            return {
                dependency,
                accessibleTo: null,
            };
        } else {
            return dependency;
        }
    });
}

export function normalizeExportRules(rules: RawExportRule[]): ExportRule[] {
    if (!rules) {
        return null;
    }

    return rules.map(exportRule => {
        // Upgrade simple strings to ExportRule structs
        if (typeof exportRule == 'string') {
            return {
                modules: exportRule,
                accessibleTo: null,
            };
        } else {
            return exportRule;
        }
    });
}

function normalizeTagRules(rules: RawTagRule[]): TagRule[] {
    if (!rules) {
        return null;
    }

    return rules.map((tag): TagRule => {
        // Upgrade simple strings to DependencyRule structs
        if (typeof tag == 'string') {
            return {
                applicableTo: null,
                tag,
            };
        }

        // If only a single string was provided, convert it into an array
        if (typeof tag.applicableTo === 'string') {
            return {
                applicableTo: [tag.applicableTo],
                tag: tag.tag
            };
        }

        return {
            applicableTo: tag.applicableTo,
            tag: tag.tag
        };
    });
}
