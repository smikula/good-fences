import * as fs from 'fs';
import * as ts from 'typescript';
import getCompilerHost from './getCompilerHost';
import getCompilerOptions from './getCompilerOptions';

export default function validateFile(filePath: string) {
    console.log('Validating file:', filePath);

    let fileInfo = ts.preProcessFile(fs.readFileSync(filePath).toString(), true, true);
    fileInfo.importedFiles.forEach(importInfo => {
        let resolvedFile = ts.resolveModuleName(
            importInfo.fileName,
            filePath,
            getCompilerOptions(),
            getCompilerHost(),
            null // TODO
        );

        console.log(
            '  resolvedModule: ',
            resolvedFile.resolvedModule && resolvedFile.resolvedModule.resolvedFileName
        );
    });

    console.log();
}
