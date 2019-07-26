import Config from '../types/config/Config';
import getAllConfigs from '../utils/getAllConfigs';
import { reportWarning } from '../core/result';

export function validateTagsExist() {
    const allConfigs = getAllConfigs();
    const allTags: any = {};

    // Accumulate all tags that are defined
    for (const key of Object.keys(allConfigs)) {
        const config = allConfigs[key];

        if (config.tags) {
            for (const tag of config.tags) {
                allTags[tag] = true;
            }
        }
    }

    // Warn for tags that are referenced but not actually defined
    for (const key of Object.keys(allConfigs)) {
        const config = allConfigs[key];
        forEachTagReferencedInConfig(config, tag => {
            if (!allTags[tag]) {
                reportWarning(
                    `Tag '${tag}' is referred to but is not defined in any fence.`,
                    config
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
