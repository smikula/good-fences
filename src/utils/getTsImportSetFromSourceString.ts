import {
    createSourceFile,
    isImportDeclaration,
    isStringLiteral,
    preProcessFile,
    ScriptTarget,
    SourceFile,
} from 'typescript';

export function getTsImportSetFromSourceString(tsSource: string): Set<string> {
    let fileInfo = preProcessFile(tsSource, true, true);
    return new Set(fileInfo.importedFiles.map(importedFile => importedFile.fileName));

    // const sourceFile: SourceFile = createSourceFile(
    //     'mock-file',
    //     tsSource,
    //     ScriptTarget.Latest // langugeVersion
    // );

    // const importSet = new Set<string>();

    // sourceFile.forEachChild(c => {
    //     if (isImportDeclaration(c)) {
    //         if (!isStringLiteral(c.moduleSpecifier)) {
    //             throw new Error('encountered dynamic import? ' + c.moduleSpecifier.getFullText());
    //         }
    //         importSet.add(c.moduleSpecifier.text);
    //     }
    // });

    // return importSet;
}
