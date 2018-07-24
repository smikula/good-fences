import NormalizedPath from '../types/NormalizedPath';
import normalizePath from '../utils/normalizePath';
import TypeScriptProgram from '../core/TypeScriptProgram';
import validateExportRules from './validateExportRules';

export default function validateFile(filePath: NormalizedPath, tsProgram: TypeScriptProgram) {
    const importedFiles = tsProgram.getImportsForFile(filePath);
    importedFiles.forEach(importInfo => {
        const resolvedFileName = tsProgram.resolveImportFromFile(importInfo.fileName, filePath);
        if (resolvedFileName) {
            validateExportRules(filePath, normalizePath(resolvedFileName));
        }
    });
}
