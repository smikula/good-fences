import { SourceFileProvider } from './SourceFileProvider';
import { glob } from 'glob';
import NormalizedPath from '../types/NormalizedPath';
import * as ts from 'typescript';
import { readAndParseTsConfigFile } from './readAndParseTsConfigFile';
import { promisify } from 'util';
import * as fs from 'fs';
const readFile = promisify(fs.readFile);

export class GlobSourceFileProvider implements SourceFileProvider {
    private parsedConfig: ts.ParsedCommandLine;
    private compilerOptions: ts.CompilerOptions;
    private compilerHost: ts.CompilerHost;

    constructor(configFile: NormalizedPath, private rootDirs: string[]) {
        this.parsedConfig = readAndParseTsConfigFile(configFile);
        this.compilerOptions = this.parsedConfig.options;
        this.compilerHost = ts.createCompilerHost(this.compilerOptions);
    }

    async getSourceFiles(): Promise<string[]> {
        const includeJsFiles =
            this.parsedConfig.options.allowJs || this.parsedConfig.options.checkJs;

        const allRootsDiscoveredFiles: string[][] = await Promise.all(
            this.rootDirs.map(
                rootDir =>
                    new Promise<string[]>((res, rej) =>
                        glob(
                            includeJsFiles ? '**/!(.d)*@(.js|.ts)' : '**/*!(.d)*.ts',
                            {
                                root: rootDir,
                            },
                            (err, result: string[]) => {
                                if (err) {
                                    rej(err);
                                } else {
                                    res(result);
                                }
                            }
                        )
                    )
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