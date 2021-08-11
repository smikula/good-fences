import * as ts from 'typescript';
import * as path from 'path';
import NormalizedPath from '../types/NormalizedPath';
import { SourceFileProvider } from './SourceFileProvider';

// Helper class for interacting with TypeScript
export default class TypeScriptProgram implements SourceFileProvider {
    private compilerOptions: ts.CompilerOptions;
    private compilerHost: ts.CompilerHost;
    private program: ts.Program;

    constructor(configFile: NormalizedPath) {
        // Parse the config file
        const config = readConfigFile(configFile);
        const projectPath = path.dirname(configFile);
        const parsedConfig = ts.parseJsonConfigFileContent(config, ts.sys, projectPath);
        this.compilerOptions = parsedConfig.options;

        // Create the program
        this.compilerHost = ts.createCompilerHost(this.compilerOptions);
        this.program = ts.createProgram(
            parsedConfig.fileNames,
            this.compilerOptions,
            this.compilerHost
        );
    }

    getSourceFiles() {
        // Filter out .d.ts files
        return this.program
            .getSourceFiles()
            .map(file => file.fileName)
            .filter(fileName => !fileName.endsWith('.d.ts'));
    }

    // Get all imports from a given file
    getImportsForFile(fileName: NormalizedPath) {
        let fileInfo = ts.preProcessFile(ts.sys.readFile(fileName), true, true);
        return fileInfo.importedFiles.map(importedFile => importedFile.fileName);
    }

    // Resolve an imported module
    resolveImportFromFile(containingFile: NormalizedPath, moduleName: string) {
        const resolvedFile = ts.resolveModuleName(
            moduleName,
            containingFile.replace(/\\/g, '/'), // TypeScript doesn't like backslashes here
            this.compilerOptions,
            this.compilerHost,
            null // TODO: provide a module resolution cache
        );

        return resolvedFile.resolvedModule && resolvedFile.resolvedModule.resolvedFileName;
    }
}

function readConfigFile(configFile: NormalizedPath) {
    const { config, error } = ts.readConfigFile(configFile, ts.sys.readFile);

    if (error) {
        throw new Error('Error reading project file: ' + error.messageText);
    }

    return config;
}
