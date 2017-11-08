import * as path from 'path';
import Path from './types/Path';

export default function createPath(rawPath: string) {
    // Resolve the raw path to an absolute path
    let normalizedPath = path.resolve(rawPath);
    return <Path>normalizedPath;
}
