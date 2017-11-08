import Path from './types/Path';
import createPath from './createPath';
import TypeScriptProgram from './TypeScriptProgram';
import validateImportIsAccessible from './validateImportIsAccessible';

export default function validateFile(filePath: Path, tsProgram: TypeScriptProgram) {
    const importedFiles = tsProgram.getImportsForFile(filePath);
    importedFiles.forEach(importInfo => {
        const resolvedFileName = tsProgram.resolveImportFromFile(importInfo.fileName, filePath);
        if (resolvedFileName) {
            validateImportIsAccessible(filePath, createPath(resolvedFileName));
        }
    });
}
