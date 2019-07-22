import * as path from 'path';
import getOptions from '../utils/getOptions';
import Config from '../types/config/Config';
import GoodFencesError from '../types/GoodFencesError';
import GoodFencesResult from '../types/GoodFencesResult';
import ConfigWarning from '../types/ConfigWarning';

const result: GoodFencesResult = {
    errors: [],
    warnings: [],
};

export function getResult() {
    return result;
}

export function reportError(
    message: string,
    sourceFile: string,
    rawImport: string,
    config: Config
) {
    let fencePath = config.path + path.sep + 'fence.json';

    let detailedMessage =
        `Good-fences violation in ${sourceFile}:\n` +
        `    ${message}: ${rawImport}\n` +
        `    Fence: ${fencePath}`;

    const error: GoodFencesError = {
        message,
        sourceFile,
        rawImport,
        fencePath,
        detailedMessage,
    };

    if (getOptions().onError) {
        getOptions().onError(error);
    }

    result.errors.push(error);
}

export function reportWarning(message: string, config: Config) {
    let fencePath = config.path + path.sep + 'fence.json';
    let detailedMessage = `Good-fences warning: ${message}\n` + `    Fence: ${fencePath}`;

    const configWarning: ConfigWarning = {
        message,
        fencePath,
        detailedMessage,
    };

    result.warnings.push(configWarning);
}
