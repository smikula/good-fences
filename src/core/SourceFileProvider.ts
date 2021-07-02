export interface SourceFileProvider {
    getSourceFiles(searchRoots?: string[]): Promise<string[]> | string[];
    getImportsForFile(filePath: string): Promise<string[]> | string[];
    resolveImportFromFile(
        importer: string,
        importSpecifier: string
    ): Promise<string | undefined> | string | undefined;
}
