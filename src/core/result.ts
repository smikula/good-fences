import * as path from 'path';
import Config from '../types/config/Config';
import GoodFencesError from '../types/GoodFencesError';
import GoodFencesResult from '../types/GoodFencesResult';
import ViolationType from '../types/ViolationType';
import ImportRecord from './ImportRecord';

const result: GoodFencesResult = {
    errors: [],
    warnings: [],
};

export function getResult() {
    return result;
}

export function reportViolation(
    message: string,
    sourceFile: string,
    importRecord: ImportRecord,
    config: Config,
    violationType: ViolationType,
) {
    let fencePath = config.path + path.sep + 'fence.json';

    let detailedMessage =
        `Good-fences violation in ${sourceFile}:\n` +
        `    ${message}: ${importRecord.rawImport}\n` +
        `    Fence: ${fencePath}`;

    const error: GoodFencesError = {
        message,
        sourceFile,
        rawImport: importRecord.rawImport,
        fencePath,
        detailedMessage,
        violationType,
    };

    result.errors.push(error);
}

export function reportConfigError(message: string, configPath: string) {
    let fencePath = configPath + path.sep + 'fence.json';

    let detailedMessage =
        `Good-fences configuration error: ${message}\n` + `    Fence: ${fencePath}`;

    const error: GoodFencesError = {
        message,
        fencePath,
        detailedMessage,
    };

    result.errors.push(error);
}

export function reportWarning(message: string, configPath: string) {
    let fencePath = configPath + path.sep + 'fence.json';
    let detailedMessage = `Good-fences warning: ${message}\n` + `    Fence: ${fencePath}`;

    const warning: GoodFencesError = {
        message,
        fencePath,
        detailedMessage,
    };

    result.warnings.push(warning);
}
