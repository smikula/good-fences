import NormalizedPath from '../types/NormalizedPath';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';

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
        return this.filePath.split('\\').indexOf('node_modules') != -1;
    }

    get packageName() {
        let pathParts = this.filePath.split('\\');
        let i = pathParts.indexOf('node_modules');
        return pathParts[i + 1];
    }
}
