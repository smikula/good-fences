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

/**
 * Extensions to check for when resolving with tsconfig-paths or from relative requires
 *
 * TODO: Should this be settable in options / from the CLI when using FdirSourceFileProvider?
 * Or possibly parsed out of the tsconfig.json?
 */
const ALLOWED_EXTENSIONS = ['.d.ts', '.d.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'];

export class FDirSourceFileProvider implements SourceFileProvider {
    parsedCommandLine: ts.ParsedCommandLine;
    matchPath: MatchPathAsync;

    constructor(configFileName: NormalizedPath, private rootDirs: string[]) {
        // Load the full config file, relying on typescript to recursively walk the "extends" fields,
        // while stubbing readDirectory calls to stop the full file walk of the include() patterns.
        //
        // We do this because we need to access the parsed compilerOptions, but do not care about
        // the full file list.
        this.parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
            configFileName,
            {}, // optionsToExtend
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

        this.matchPath = createMatchPathAsync(
            this.parsedCommandLine.options.baseUrl,
            this.parsedCommandLine.options.paths
        );
    }

    async getSourceFiles(searchRoots?: string[]): Promise<string[]> {
        const allRootsDiscoveredFiles: string[][] = await Promise.all(
            (searchRoots || this.rootDirs).map(
                (rootDir: string) =>
                    new fdir()
                        .glob(
                            this.parsedCommandLine.options.allowJs
                                ? `**/*@(.js|.ts${
                                      this.parsedCommandLine.options.jsx ? '|.jsx|.tsx' : ''
                                  })`
                                : `**/**@(.ts${this.parsedCommandLine.options.jsx ? '|.tsx' : ''})`
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
            const directImportResult = await checkExtensions(
                path.join(path.dirname(importer), importSpecifier),
                [
                    ...ALLOWED_EXTENSIONS,
                    // Also check for no-exension to permit import specifiers that
                    // already have an extension (e.g. require('foo.js'))
                    '',
                    // also check for directory index imports
                    ...ALLOWED_EXTENSIONS.map(x => '/index' + x),
                ]
            );

            if (
                directImportResult &&
                ALLOWED_EXTENSIONS.some(extension => directImportResult.endsWith(extension))
            ) {
                // this is an allowed script file
                return directImportResult;
            } else {
                // this is an asset file
                return undefined;
            }
        } else {
            // resolve with tsconfig-paths (use the paths map, then fall back to node-modules)
            return await new Promise((res, rej) =>
                this.matchPath(
                    importSpecifier,
                    undefined, // readJson
                    undefined, // fileExists
                    [...ALLOWED_EXTENSIONS, ''],
                    async (err: Error, result: string) => {
                        if (err) {
                            rej(err);
                        } else if (!result) {
                            res(undefined);
                        } else {
                            if (
                                isFile(result) &&
                                ALLOWED_EXTENSIONS.some(extension => result.endsWith(extension))
                            ) {
                                // this is an exact require of a known script extension, resolve
                                // it up front
                                res(result);
                            } else {
                                // tsconfig-paths returns a path without an extension.
                                // if it resolved to an index file, it returns the path to
                                // the directory of the index file.
                                if (await isDirectory(result)) {
                                    res(
                                        checkExtensions(
                                            path.join(result, 'index'),
                                            ALLOWED_EXTENSIONS
                                        )
                                    );
                                } else {
                                    res(checkExtensions(result, ALLOWED_EXTENSIONS));
                                }
                            }
                        }
                    }
                )
            );
        }
    }
}

async function isFile(filePath: string): Promise<boolean> {
    try {
        // stat will throw if the file does not exist
        const statRes = await stat(filePath);
        if (statRes.isFile()) {
            return true;
        }
    } catch {
        // file does not exist
        return false;
    }
}

async function isDirectory(filePath: string): Promise<boolean> {
    try {
        // stat will throw if the file does not exist
        const statRes = await stat(filePath);
        if (statRes.isDirectory()) {
            return true;
        }
    } catch {
        // file does not exist
        return false;
    }
}

async function checkExtensions(
    filePathNoExt: string,
    extensions: string[]
): Promise<string | undefined> {
    for (let ext of extensions) {
        const joinedPath = filePathNoExt + ext;
        if (await isFile(joinedPath)) {
            return joinedPath;
        }
    }
    return undefined;
}
