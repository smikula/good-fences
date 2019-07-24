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

        if (config.exports) {
            for (const exportRule of config.exports) {
                validateAccessibleToTags(exportRule.accessibleTo, config, allTags);
            }
        }

        if (config.dependencies) {
            for (const dependencyRule of config.dependencies) {
                validateAccessibleToTags(dependencyRule.accessibleTo, config, allTags);
            }
        }
    }
}

function validateAccessibleToTags(tags: string | string[], config: Config, allTags: any) {
    if (!tags) {
        return;
    } else if (!Array.isArray(tags)) {
        testTag(tags, config, allTags);
    } else {
        for (const tag in tags) {
            testTag(tag, config, allTags);
        }
    }
}

function testTag(tag: string, config: Config, allTags: any) {
    if (!allTags[tag]) {
        reportWarning(`Tag '${tag}' is referred to but is not defined in any fence.`, config);
    }
}
