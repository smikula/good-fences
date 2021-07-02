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

const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '', '.json'];

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

    async getSourceFiles(searchRoots?: string[]): Promise<string[]> {
        console.log('search roots', searchRoots);
        const allRootsDiscoveredFiles: string[][] = await Promise.all(
            (searchRoots || this.rootDirs).map(
                (rootDir: string) =>
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

        return [...new Set<string>(allRootsDiscoveredFiles.reduce((a, b) => a.concat(b), []))];
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
            return await checkExtensions(
                path.join(path.dirname(importer), importSpecifier),
                ALLOWED_EXTENSIONS
            );
        } else {
            // resolve with tsconfig-paths (use the paths map, then fall back to node-modules)
            return await new Promise((res, rej) =>
                this.matchPath(
                    importSpecifier,
                    undefined,
                    undefined,
                    ALLOWED_EXTENSIONS,
                    async (err: Error, result: string) => {
                        if (err) {
                            rej(err);
                        } else if (!result) {
                            res(result);
                        } else {
                            const withoutIndex = await checkExtensions(result, ALLOWED_EXTENSIONS);
                            if (withoutIndex) {
                                res(withoutIndex);
                            } else {
                                // fallback -- check if tsconfig-paths resolved to a
                                // folder index file
                                res(
                                    checkExtensions(path.join(result, 'index'), ALLOWED_EXTENSIONS)
                                );
                            }
                        }
                    }
                )
            );
        }
    }
}

async function checkExtensions(noext: string, extensions: string[]): Promise<string | undefined> {
    for (let ext of extensions) {
        const joinedPath = noext + ext;
        try {
            // access will throw if the file does no~t exist
            const statRes = await stat(joinedPath);
            if (statRes.isFile()) {
                return joinedPath;
            }
        } catch {
            // file does not exist, smother the ENOENT
        }
    }
    return undefined;
}
