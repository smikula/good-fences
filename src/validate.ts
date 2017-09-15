import * as fs from 'fs';
import * as glob from 'glob';
import * as ts from 'typescript';
import getCompilerOptions from './getCompilerOptions';
import getRules from './getRules';

export default function validate() {
    let rules = getRules();
    console.log('Rules:', rules);

    let files = glob.sync('src/**/*.ts');

    const compilerOptions = getCompilerOptions();
    let compilerHost = ts.createCompilerHost(compilerOptions);

    files.forEach(file => {
        let fileInfo = ts.preProcessFile(fs.readFileSync(file).toString(), true, true);
        console.log('Validating file:', file);

        fileInfo.importedFiles.forEach(importInfo => {
            let resolvedFile = ts.resolveModuleName(
                importInfo.fileName,
                file,
                compilerOptions,
                compilerHost,
                null // TODO
            );

            console.log(
                'resolvedModule:',
                resolvedFile.resolvedModule && resolvedFile.resolvedModule.resolvedFileName
            );
        });

        console.log();
    });
}
