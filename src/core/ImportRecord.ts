import NormalizedPath from '../types/NormalizedPath';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';

export default class ImportRecord {
    public filePath: NormalizedPath;

    constructor(importSource: string, sourceFile: NormalizedPath, tsProgram: TypeScriptProgram) {
        const resolvedFileName = tsProgram.resolveImportFromFile(importSource, sourceFile);
        if (resolvedFileName) {
            this.filePath = normalizePath(resolvedFileName);
        }
    }
}
