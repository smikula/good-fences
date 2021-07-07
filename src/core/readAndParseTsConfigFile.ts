import * as path from 'path';
import * as ts from 'typescript';
import NormalizedPath from '../types/NormalizedPath';

export function readAndParseTsConfigFile(configFile: NormalizedPath) {
    const projectPath = path.dirname(configFile);

    const { config, error } = ts.readConfigFile(configFile, ts.sys.readFile);

    if (error) {
        throw new Error('Error reading project file: ' + error.messageText);
    }

    return ts.parseJsonConfigFileContent(config, ts.sys, projectPath);
}
