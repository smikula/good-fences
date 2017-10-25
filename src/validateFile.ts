import TypeScriptProgram from './TypeScriptProgram';
import validateImportIsAccessible from './validateImportIsAccessible';

export default function validateFile(filePath: string, tsProgram: TypeScriptProgram) {
    const importedFiles = tsProgram.getImportsForFile(filePath);
    importedFiles.forEach(importInfo => {
        const resolvedFileName = tsProgram.resolveImportFromFile(importInfo.fileName, filePath);
        if (resolvedFileName) {
            validateImportIsAccessible(filePath, resolvedFileName);
        }
    });
}
