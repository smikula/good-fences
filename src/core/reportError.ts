import * as path from 'path';
import getOptions from '../utils/getOptions';
import Config from '../types/config/Config';
import ValidationError from '../types/ValidationError';

const errors: ValidationError[] = [];

export default function reportError(
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

    const validationError: ValidationError = {
        message,
        sourceFile,
        rawImport,
        fencePath,
        detailedMessage,
    };

    if (getOptions().onError) {
        getOptions().onError(validationError);
    }

    errors.push(validationError);
}

export function getErrors() {
    return errors;
}
