import Path from './types/Path';
import getConfigsForFile from './getConfigsForFile';

export default function getTagsForFile(filePath: Path): string[] {
    let configs = getConfigsForFile(filePath);
    let tags: { [tag: string]: boolean } = {};

    configs.forEach(config => {
        if (config.tags) {
            config.tags.forEach(tag => {
                tags[tag] = true;
            });
        }
    });

    return Object.keys(tags).sort();
}
