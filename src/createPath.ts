import * as path from 'path';
import Path from './types/Path';

export default function createPath(...pathSegments: string[]) {
    // Resolve the raw path to an absolute path
    let normalizedPath = path.resolve.apply(null, pathSegments);

    // Normalize drive letters to upper case
    if (normalizedPath.match(/^[a-z]:/)) {
        normalizedPath = normalizedPath.substr(0, 1).toUpperCase() + normalizedPath.substr(1);
    }

    return <Path>normalizedPath;
}
