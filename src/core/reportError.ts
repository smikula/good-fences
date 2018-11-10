import * as path from 'path';
import getOptions from '../utils/getOptions';
import Config from '../types/config/Config';

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

    if (getOptions().onError) {
        getOptions().onError({
            message,
            sourceFile,
            rawImport,
            fencePath,
            detailedMessage,
        });
    }
}
