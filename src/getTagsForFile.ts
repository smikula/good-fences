import * as path from 'path';
import getConfig from './getConfig';

export default function getTagsForFile(filePath: string): string[] {
    let config = getConfig();
    let tags = {};

    let pathSegments = path.resolve(path.dirname(filePath)).split(path.sep);
    while (pathSegments.length) {
        let dirPath = pathSegments.join(path.sep);
        if (config[dirPath] && config[dirPath].tags) {
            config[dirPath].tags.forEach(tag => {
                tags[tag] = true;
            });
        }

        pathSegments.pop();
    }

    return Object.keys(tags).sort();
}
