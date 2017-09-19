import * as fs from 'fs';
import * as glob from 'glob';
import * as ts from 'typescript';
import getCompilerHost from './getCompilerHost';
import getCompilerOptions from './getCompilerOptions';
import getRules from './getRules';

export default function validate() {
    let rules = getRules();
    console.log('Rules:', rules);

    let files = glob.sync('src/**/*.ts');

    files.forEach(file => {
        let fileInfo = ts.preProcessFile(fs.readFileSync(file).toString(), true, true);
        console.log('Validating file:', file);

        fileInfo.importedFiles.forEach(importInfo => {
            let resolvedFile = ts.resolveModuleName(
                importInfo.fileName,
                file,
                getCompilerOptions(),
                getCompilerHost(),
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
