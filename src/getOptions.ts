import * as path from 'path';
import Options from './types/Options';
import createPath from './createPath';

let options: Options;

export default function getOptions() {
    return options;
}

export function setOptions(providedOptions: Options) {
    options = providedOptions;

    // Normalize and apply defaults
    options.rootDir = createPath(options.rootDir || process.cwd());
    options.project = createPath(options.project || path.resolve(options.rootDir, 'tsconfig.json'));
}
