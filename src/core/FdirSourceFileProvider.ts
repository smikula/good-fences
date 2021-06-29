import { SourceFileProvider } from './SourceFileProvider';
import { fdir } from 'fdir';
import NormalizedPath from '../types/NormalizedPath';
import * as ts from 'typescript';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
import { createMatchPathAsync, MatchPathAsync } from 'tsconfig-paths';
import { tick } from '../utils/tick';

export class FDirSourceFileProvider implements SourceFileProvider {
    parsedCommandLine: ts.ParsedCommandLine;
    matchPath: MatchPathAsync;

    constructor(configFileName: NormalizedPath, private rootDirs: string[]) {
        console.log('parsing config', tick());

        this.parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
            configFileName,
            {},
            {
                getCurrentDirectory: process.cwd,
                fileExists: fs.existsSync,
                useCaseSensitiveFileNames: true,
                readFile: path => fs.readFileSync(path, 'utf-8'),
                readDirectory: () => {
                    // this is supposed to be the recursive file walk.
                    // since we don't care about _actually_ discovering files,
                    // only about parsing the config's compilerOptions
                    // (and tracking the "extends": fields across multiple files)
                    // we short circuit this.
                    return [];
                },
                onUnRecoverableConfigFileDiagnostic: diagnostic => {
                    console.error(diagnostic);
                    process.exit(1);
                },
            }
        );
        console.log('parsed', tick());

        console.log('matching paths');
        this.matchPath = createMatchPathAsync(
            this.parsedCommandLine.options.baseUrl,
            this.parsedCommandLine.options.paths
        );
        console.log('created matchpath', tick());
    }

    async getSourceFiles(): Promise<string[]> {
        const allRootsDiscoveredFiles: string[][] = await Promise.all(
            this.rootDirs.map(
                rootDir =>
                    new fdir()
                        .glob(
                            this.parsedCommandLine.options.allowJs
                                ? '**/!(.d)*@(.js|.ts)'
                                : '**/*!(.d)*.ts'
                        )
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
        if (importSpecifier.startsWith('.')) {
            // resolve relative and check extensions
            return await checkExtensions(path.join(path.dirname(importer), importSpecifier), [
                '.ts',
                '.tsx',
                '.js',
                '.jsx',
            ]);
        } else {
            // resolve with tsconfig-paths (use the paths map, then fall back to node-modules)
            return await new Promise((res, rej) =>
                this.matchPath(
                    importSpecifier,
                    undefined,
                    undefined,
                    ['.ts', '.tsx', '.js', '.jsx'],
                    (err: Error, result: string) => {
                        if (err) {
                            rej(err);
                        }
                        res(result);
                    }
                )
            );
        }
    }
}

async function checkExtensions(noext: string, extensions: string[]): Promise<string | undefined> {
    for (let ext of extensions) {
        const joinedPath = noext + ext;
        const statResult = await stat(joinedPath);
        if (statResult.isFile) {
            return joinedPath;
        }
    }
    return undefined;
}
