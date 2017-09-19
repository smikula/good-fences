import * as path from 'path';
import getRules from './getRules';

export default function getTagsForFile(filePath: string): string[] {
    let rules = getRules();
    let tags = {};

    let pathSegments = path.resolve(path.dirname(filePath)).split(path.sep);
    while (pathSegments.length) {
        let dirPath = pathSegments.join(path.sep);
        if (rules[dirPath] && rules[dirPath].tags) {
            rules[dirPath].tags.forEach(tag => {
                tags[tag] = true;
            });
        }

        pathSegments.pop();
    }

    return Object.keys(tags).sort();
}
