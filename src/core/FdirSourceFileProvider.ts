import { SourceFileProvider } from './SourceFileProvider';
import { fdir } from 'fdir';
import NormalizedPath from '../types/NormalizedPath';
import * as ts from 'typescript';
import { readAndParseTsConfigFile } from './readAndParseTsConfigFile';
import { promisify } from 'util';
import * as fs from 'fs';
import { tick } from '../utils/tick';
const readFile = promisify(fs.readFile);

export class FDirSourceFileProvider implements SourceFileProvider {
    private parsedConfig: ts.ParsedCommandLine;
    private compilerOptions: ts.CompilerOptions;
    private compilerHost: ts.CompilerHost;

    constructor(configFile: NormalizedPath, private rootDirs: string[]) {
        console.log('parsing config', tick());
        this.parsedConfig = readAndParseTsConfigFile(configFile);
        console.log('parsed in:', tick());
        console.log('parsed to:', this.parsedConfig);
        this.compilerOptions = this.parsedConfig.options;
        this.compilerHost = ts.createCompilerHost(this.compilerOptions);
        console.log('host initialized in:', tick());
    }

    async getSourceFiles(): Promise<string[]> {
        const includeJsFiles =
            this.parsedConfig.options.allowJs || this.parsedConfig.options.checkJs;

        const allRootsDiscoveredFiles: string[][] = await Promise.all(
            this.rootDirs.map(
                rootDir =>
                    new fdir()
                        .glob(includeJsFiles ? '**/!(.d)*@(.js|.ts)' : '**/*!(.d)*.ts')
                        .withFullPaths()
                        .crawl(rootDir)
                        .withPromise() as Promise<string[]>
            )
        );

        return allRootsDiscoveredFiles.reduce((a, b) => a.concat(b), []);
    }

    async getImportsForFile(filePath: string): Promise<string[]> {
        const fileInfo = ts.preProcessFile(await readFile(filePath, 'utf-8'), true, true);
        return fileInfo.importedFiles.map(importedFile => importedFile.fileName);
    }

    async resolveImportFromFile(
        importer: string,
        importSpecifier: string
    ): Promise<string | undefined> {
        const resolvedFile = ts.resolveModuleName(
            importSpecifier,
            importer.replace(/\\/g, '/'), // TypeScript doesn't like backslashes here
            this.compilerOptions,
            this.compilerHost,
            null // TODO: provide a module resolution cache
        );

        return resolvedFile.resolvedModule && resolvedFile.resolvedModule.resolvedFileName;
    }
}
