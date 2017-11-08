import * as path from 'path';
import * as ts from 'typescript';
import Path from './types/Path';

// Helper class for interacting with TypeScript
export default class TypeScriptProgram {
    private compilerOptions: ts.CompilerOptions;
    private compilerHost: ts.CompilerHost;
    private program: ts.Program;

    constructor(configFile: Path) {
        // Parse the config file
        const projectPath = path.dirname(configFile);
        const config = readConfigFile(configFile);
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
    getImportsForFile(fileName: Path) {
        let fileInfo = ts.preProcessFile(ts.sys.readFile(fileName), true, true);
        return fileInfo.importedFiles;
    }

    // Resolve an imported module
    resolveImportFromFile(moduleName: string, containingFile: Path) {
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

function readConfigFile(configFile: Path) {
    const { config, error } = ts.readConfigFile(configFile, ts.sys.readFile);

    if (error) {
        throw new Error('Error reading project file: ' + error.messageText);
    }

    return config;
}
