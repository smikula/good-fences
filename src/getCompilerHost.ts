import * as ts from 'typescript';
import getCompilerOptions from './getCompilerOptions';

let compilerHost;

export default function getCompilerHost() {
    if (!compilerHost) {
        let compilerOptions = getCompilerOptions();
        compilerHost = ts.createCompilerHost(compilerOptions);
    }

    return compilerHost;
}
