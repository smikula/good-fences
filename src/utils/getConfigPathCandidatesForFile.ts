import * as path from 'path';
import NormalizedPath from '../types/NormalizedPath';
import normalizePath from './normalizePath';

export function getConfigPathCandidatesForFile(filePath: NormalizedPath): string[] {
    const candidates: string[] = [];

    let pathSegments = normalizePath(path.dirname(filePath)).split(path.sep);
    while (pathSegments.length) {
        let dirPath = pathSegments.join(path.sep);
        candidates.push(dirPath);
        pathSegments.pop();
    }

    return candidates;
}
