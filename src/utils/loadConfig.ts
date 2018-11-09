import * as fs from 'fs';
import * as path from 'path';
import RawConfig from '../types/rawConfig/RawConfig';
import Config from '../types/config/Config';
import normalizePath from './normalizePath';
import RawDependencyRule from '../types/rawConfig/RawDependencyRule';

export default function loadConfig(file: string): Config {
    // Load the raw config
    let rawConfig: RawConfig = JSON.parse(fs.readFileSync(file).toString());

    // Normalize it
    return {
        path: normalizePath(path.dirname(file)),
        tags: rawConfig.tags,
        exports: rawConfig.exports,
        dependencies: normalizeDependencyRules(rawConfig.dependencies),
        imports: rawConfig.imports,
    };
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
