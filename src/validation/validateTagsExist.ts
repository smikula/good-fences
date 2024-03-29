import Config from '../types/config/Config';
import getConfigManager from '../utils/getConfigManager';
import { reportWarning } from '../core/result';

export function validateTagsExist() {
    const allConfigs = getConfigManager().getAllConfigs();
    const allTags = new Set<string>();

    // Accumulate all tags that are defined
    for (const key of Object.keys(allConfigs)) {
        const config = allConfigs[key];

        if (config.tags) {
            for (const tag of config.tags) {
                allTags.add(tag);
            }
        }
    }

    // Warn for tags that are referenced but not actually defined
    for (const key of Object.keys(allConfigs)) {
        const config = allConfigs[key];
        forEachTagReferencedInConfig(config, tag => {
            if (!allTags.has(tag)) {
                reportWarning(
                    `Tag '${tag}' is referred to but is not defined in any fence.`,
                    config.path
                );
            }
        });
    }
}

function forEachTagReferencedInConfig(config: Config, callback: (tag: string) => void) {
    if (config.exports) {
        for (const exportRule of config.exports) {
            forEachTag(exportRule.accessibleTo, callback);
        }
    }

    if (config.dependencies) {
        for (const dependencyRule of config.dependencies) {
            forEachTag(dependencyRule.accessibleTo, callback);
        }
    }

    if (config.imports) {
        for (const importTag of config.imports) {
            callback(importTag);
        }
    }
}

function forEachTag(tags: string | string[], callback: (tag: string) => void) {
    if (!tags) {
        return;
    }

    if (!Array.isArray(tags)) {
        tags = [tags];
    }

    for (const tag of tags) {
        callback(tag);
    }
}
