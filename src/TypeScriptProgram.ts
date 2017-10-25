import * as path from 'path';
import * as ts from 'typescript';

// Helper class for interacting with TypeScript
export default class TypeScriptProgram {
    private compilerOptions: ts.CompilerOptions;
    private compilerHost: ts.CompilerHost;
    private program: ts.Program;

    constructor(configFile: string) {
        // Parse the config file
        const projectPath = path.dirname(path.resolve(configFile));
        const { config } = ts.readConfigFile(configFile, ts.sys.readFile);
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

    // Get all imports from a given file
    getImportsForFile(fileName: string) {
        let fileInfo = ts.preProcessFile(ts.sys.readFile(fileName), true, true);
        return fileInfo.importedFiles;
    }

    // Resolve an imported module
    resolveImportFromFile(moduleName: string, containingFile: string) {
        const resolvedFile = ts.resolveModuleName(
            moduleName,
            containingFile,
            this.compilerOptions,
            this.compilerHost,
            null // TODO: provide a module resolution cache
        );

        return resolvedFile.resolvedModule && resolvedFile.resolvedModule.resolvedFileName;
    }
}
