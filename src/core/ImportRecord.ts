import NormalizedPath from '../types/NormalizedPath';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';
import * as path from 'path';

export default class ImportRecord {
    public filePath: NormalizedPath;

    constructor(
        public rawImport: string,
        sourceFile: NormalizedPath,
        tsProgram: TypeScriptProgram
    ) {
        const resolvedFileName = tsProgram.resolveImportFromFile(rawImport, sourceFile);
        if (resolvedFileName) {
            this.filePath = normalizePath(resolvedFileName);
        }
    }

    // Is this import an external dependency (i.e. is it under node_modules)?
    get isExternal() {
        return this.filePath.split(path.sep).indexOf('node_modules') != -1;
    }
}
