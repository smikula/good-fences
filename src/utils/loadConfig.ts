import * as fs from 'fs';
import * as path from 'path';
import stripJsonComments from 'strip-json-comments';
import RawConfig from '../types/rawConfig/RawConfig';
import Config from '../types/config/Config';
import normalizePath from './normalizePath';
import RawDependencyRule from '../types/rawConfig/RawDependencyRule';
import RawExportRule from '../types/rawConfig/RawExportRule';
import ConfigSet from '../types/ConfigSet';
import ExportRule from '../types/config/ExportRule';
import validateRawConfig from '../validation/validateRawConfig';
import NormalizedPath from '../types/NormalizedPath';
import DependencyRule from '../types/config/DependencyRule';

export function loadConfigFromString(
    configPath: NormalizedPath,
    fileContent: string
): Config | null {
    // Strip BOM if needed
    if (fileContent.charCodeAt(0) === 0xfeff) {
        fileContent = fileContent.slice(1);
    }

    fileContent = stripJsonComments(fileContent);

    // Load the raw config
    let rawConfig: RawConfig = JSON.parse(fileContent);

    // Validate it
    if (validateRawConfig(rawConfig, configPath)) {
        // Normalize it
        return {
            path: configPath,
            tags: rawConfig.tags,
            exports: normalizeExportRules(rawConfig.exports),
            dependencies: normalizeDependencyRules(rawConfig.dependencies),
            imports: rawConfig.imports,
        };
    }

    return null;
}

export default function loadConfig(file: string, configSet: ConfigSet) {
    // Load the raw config
    const configPath = normalizePath(path.dirname(file));

    // Validate and normalize it
    const config = loadConfigFromString(configPath, fs.readFileSync(file, 'utf-8'));
    if (config) {
        // Add it to the config set
        configSet[config.path] = config;
    }
}

function normalizeDependencyRules(rules: RawDependencyRule[]): DependencyRule[] | null {
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

export function normalizeExportRules(rules: RawExportRule[]): ExportRule[] | null {
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
