import { SourceFileProvider } from './SourceFileProvider';
import { fdir } from 'fdir';
import NormalizedPath from '../types/NormalizedPath';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
import { createMatchPathAsync, MatchPathAsync } from 'tsconfig-paths';
import { getScriptFileExtensions } from '../utils/getScriptFileExtensions';
import {
    getParsedCommandLineOfConfigFile,
    JsxEmit,
    ParsedCommandLine,
    preProcessFile,
} from 'typescript';
import picomatch from 'picomatch';

export class FDirSourceFileProvider implements SourceFileProvider {
    parsedCommandLine: ParsedCommandLine;
    excludePatternsPicoMatchers: picomatch.Matcher[];
    matchPath: MatchPathAsync;
    private sourceFileGlob: string;
    private extensionsToCheckDuringImportResolution: string[];

    constructor(configFileName: NormalizedPath, private rootDirs: string[]) {
        // Load the full config file, relying on typescript to recursively walk the "extends" fields,
        // while stubbing readDirectory calls to stop the full file walk of the include() patterns.
        //
        // We do this because we need to access the parsed compilerOptions, but do not care about
        // the full file list.
        this.parsedCommandLine = getParsedCommandLineOfConfigFile(
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

        const baseUrl = this.parsedCommandLine.options.baseUrl ?? path.dirname(configFileName);
        this.excludePatternsPicoMatchers = (this.parsedCommandLine.raw?.exclude ?? []).map(
            (excludePattern: string) => {
                const matcher = picomatch(excludePattern);
                return (pathToCheck: string) => {
                    return matcher(path.relative(baseUrl, pathToCheck));
                };
            }
        );

        this.sourceFileGlob = `**/*@(${getScriptFileExtensions({
            // Derive these settings from the typescript project itself
            allowJs: this.parsedCommandLine.options.allowJs || false,
            jsx: this.parsedCommandLine.options.jsx !== JsxEmit.None,
            // Since we're trying to find script files that can have imports,
            // we explicitly exclude json modules
            includeJson: false,
            // since definition files are '.d.ts', the extra
            // definition extensions here are covered by the glob '*.ts' from
            // the above settings.
            //
            // Here as an optimization we avoid adding these definition files while
            // globbing
            includeDefinitions: false,
        }).join('|')})`;

        // Script extensions to check when looking for imports.
        this.extensionsToCheckDuringImportResolution = getScriptFileExtensions({
            // Derive these settings from the typescript project itself
            allowJs: this.parsedCommandLine.options.allowJs || false,
            jsx: this.parsedCommandLine.options.jsx !== JsxEmit.None,
            includeJson: this.parsedCommandLine.options.resolveJsonModule,
            // When scanning for imports, we always consider importing
            // definition files.
            includeDefinitions: true,
        });

        this.matchPath = createMatchPathAsync(baseUrl, this.parsedCommandLine.options.paths ?? {});
    }

    async getSourceFiles(searchRoots?: string[]): Promise<string[]> {
        const allRootsDiscoveredFiles: string[][] = await Promise.all(
            (searchRoots || this.rootDirs).map(
                (rootDir: string) =>
                    new fdir()
                        .glob(this.sourceFileGlob)
                        .withFullPaths()
                        .crawl(rootDir)
                        .withPromise() as Promise<string[]>
            )
        );

        return [
            ...new Set<string>(allRootsDiscoveredFiles.reduce((a, b) => a.concat(b), [])),
        ].filter((p: string) => !this.isPathExcluded(p));
    }

    private isPathExcluded(path: string) {
        return this.excludePatternsPicoMatchers.some(isMatch => isMatch(path));
    }

    async getImportsForFile(filePath: string): Promise<string[]> {
        const fileInfo = preProcessFile(await readFile(filePath, 'utf-8'), true, true);
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
                    ...this.extensionsToCheckDuringImportResolution,
                    // Also check for no-exension to permit import specifiers that
                    // already have an extension (e.g. require('foo.js'))
                    '',
                    // also check for directory index imports
                    ...this.extensionsToCheckDuringImportResolution.map(x => '/index' + x),
                ]
            );

            if (
                directImportResult &&
                this.extensionsToCheckDuringImportResolution.some(extension =>
                    directImportResult.endsWith(extension)
                )
            ) {
                // this is an allowed script file
                return directImportResult;
            } else {
                // this is an asset file
                return undefined;
            }
        } else {
            // resolve with tsconfig-paths (use the paths map, then fall back to node-modules)
            return await new Promise((resolve, reject) =>
                this.matchPath(
                    importSpecifier,
                    undefined, // readJson
                    undefined, // fileExists
                    [...this.extensionsToCheckDuringImportResolution, ''],
                    async (err: Error, result: string) => {
                        if (err) {
                            reject(err);
                        } else if (!result) {
                            resolve(undefined);
                        } else {
                            if (
                                isFile(result) &&
                                this.extensionsToCheckDuringImportResolution.some(extension =>
                                    result.endsWith(extension)
                                )
                            ) {
                                // this is an exact require of a known script extension, resolve
                                // it up front
                                resolve(result);
                            } else {
                                // tsconfig-paths returns a path without an extension.
                                // if it resolved to an index file, it returns the path to
                                // the directory of the index file.
                                if (await isDirectory(result)) {
                                    resolve(
                                        checkExtensions(
                                            path.join(result, 'index'),
                                            this.extensionsToCheckDuringImportResolution
                                        )
                                    );
                                } else {
                                    resolve(
                                        checkExtensions(
                                            result,
                                            this.extensionsToCheckDuringImportResolution
                                        )
                                    );
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
