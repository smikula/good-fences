import * as fs from 'fs';
import * as ts from 'typescript';
import TypeScriptProgram from './TypeScriptProgram';
import validateImportIsAccessible from './validateImportIsAccessible';

export default function validateFile(filePath: string, tsProgram: TypeScriptProgram) {
    let fileInfo = ts.preProcessFile(fs.readFileSync(filePath).toString(), true, true);
    fileInfo.importedFiles.forEach(importInfo => {
        const resolvedFileName = tsProgram.resolveImport(importInfo.fileName, filePath);
        if (resolvedFileName) {
            validateImportIsAccessible(filePath, resolvedFileName);
        }
    });
}
