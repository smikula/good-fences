import NormalizedPath from './types/NormalizedPath';
import normalizePath from './normalizePath';
import TypeScriptProgram from './TypeScriptProgram';
import validateImportIsAccessible from './validateImportIsAccessible';

export default function validateFile(filePath: NormalizedPath, tsProgram: TypeScriptProgram) {
    const importedFiles = tsProgram.getImportsForFile(filePath);
    importedFiles.forEach(importInfo => {
        const resolvedFileName = tsProgram.resolveImportFromFile(importInfo.fileName, filePath);
        if (resolvedFileName) {
            validateImportIsAccessible(filePath, normalizePath(resolvedFileName));
        }
    });
}
