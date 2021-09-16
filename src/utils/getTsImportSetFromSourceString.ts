import { preProcessFile } from 'typescript';

export function getTsImportSetFromSourceString(tsSource: string): Set<string> {
    let fileInfo = preProcessFile(tsSource, true, true);
    return new Set(fileInfo.importedFiles.map(importedFile => importedFile.fileName));
}
