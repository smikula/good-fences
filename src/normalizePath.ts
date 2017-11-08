import * as path from 'path';
import NormalizedPath from './types/NormalizedPath';

export default function normalizePath(...pathSegments: string[]) {
    // Resolve the raw path to an absolute path
    let normalizedPath = path.resolve.apply(null, pathSegments);

    // Normalize drive letters to upper case
    if (normalizedPath.match(/^[a-z]:/)) {
        normalizedPath = normalizedPath.substr(0, 1).toUpperCase() + normalizedPath.substr(1);
    }

    return <NormalizedPath>normalizedPath;
}
