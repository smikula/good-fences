import * as fs from 'fs';
import * as ts from 'typescript';
import getCompilerHost from './getCompilerHost';
import getCompilerOptions from './getCompilerOptions';
import validateImportIsAccessible from './validateImportIsAccessible';

export default function validateFile(filePath: string) {
    let fileInfo = ts.preProcessFile(fs.readFileSync(filePath).toString(), true, true);
    fileInfo.importedFiles.forEach(importInfo => {
        let resolvedFile = ts.resolveModuleName(
            importInfo.fileName,
            filePath,
            getCompilerOptions(),
            getCompilerHost(),
            null // TODO
        );

        if (resolvedFile.resolvedModule) {
            validateImportIsAccessible(filePath, resolvedFile.resolvedModule.resolvedFileName);
        }
    });
}
