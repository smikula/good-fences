import getConfigsForFile from './getConfigsForFile';

export default function getTagsForFile(filePath: string): string[] {
    let configs = getConfigsForFile(filePath);
    let tags = {};

    configs.forEach(config => {
        if (config.tags) {
            config.tags.forEach(tag => {
                tags[tag] = true;
            });
        }
    });

    return Object.keys(tags).sort();
}
