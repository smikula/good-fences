import NormalizedPath from '../types/NormalizedPath';
import getConfigsForFile from './getConfigsForFile';
import getFilePathRelativeToConfig from './getFilePathRelativeToConfig';
const minimatch = require('minimatch');


export default function getTagsForFile(filePath: NormalizedPath): string[] {
    let configs = getConfigsForFile(filePath);
    let tags: { [tag: string]: boolean } = {};

    configs.forEach(config => {
        if (config.tags) {
            const relativeFilePath = getFilePathRelativeToConfig(filePath, config);

            config.tags.forEach(tag => {
                let isApplicable: boolean;

                if (tag.applicableTo === null) {
                    // If this tag doesn't specify specific paths it is applicable,
                    // it's applicable to every file in the tree.
                    isApplicable = true;
                } else {
                    // If this file matches ANY of the glob patterns specified for
                    // the tag, then it receives the tag.
                    isApplicable = tag.applicableTo.some(
                        applicablePath => minimatch(relativeFilePath, applicablePath)
                    );
                }

                if (isApplicable) {
                    tags[tag.tag] = true;
                }
            });
        }
    });

    return Object.keys(tags).sort();
}
