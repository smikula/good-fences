import TypeScriptProgram from '../core/TypeScriptProgram';
import NormalizedPath from '../types/NormalizedPath';
import ImportRecord from '../core/ImportRecord';

export default function getImportsFromFile(filePath: NormalizedPath, tsProgram: TypeScriptProgram) {
    const importedFiles = tsProgram.getImportsForFile(filePath);
    return importedFiles
        .map(importInfo => new ImportRecord(importInfo.fileName, filePath, tsProgram))
        .filter(importRecord => importRecord.filePath);
}
