export interface SourceFileProvider {
    getSourceFiles(): Promise<string[]> | string[];
    getImportsForFile(filePath: string): Promise<string[]> | string[];
    resolveImportFromFile(
        importer: string,
        importSpecifier: string
    ): Promise<string | undefined> | string | undefined;
}
