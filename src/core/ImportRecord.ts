import NormalizedPath from '../types/NormalizedPath';
import normalizePath from '../utils/normalizePath';
import * as path from 'path';
import getOptions from '../utils/getOptions';

export default class ImportRecord {
    public filePath: NormalizedPath;

    constructor(public rawImport: string, resolvedFileName: string | undefined) {
        if (resolvedFileName) {
            this.filePath = normalizePath(resolvedFileName);
        }
    }

    // Is this import an external dependency (i.e. is it under node_modules or outside the rootDir)?
    get isExternal() {
        let isInNodeModules = this.filePath.split(path.sep).indexOf('node_modules') != -1;
        let isUnderRootFolder = getOptions().rootDir.some(rootDir =>
            this.filePath.startsWith(rootDir)
        );

        let isLocalRelativePath = this.filePath.startsWith('./');
        let isExternalPath = !isUnderRootFolder && !isLocalRelativePath;
        return isInNodeModules || isExternalPath;
    }
}
