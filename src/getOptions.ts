import * as path from 'path';
import Options from './types/Options';

let options: Options;

export default function getOptions() {
    return options;
}

export function setOptions(providedOptions: Options) {
    options = providedOptions;

    // Normalize and apply defaults
    options.rootDir = options.rootDir ? path.resolve(options.rootDir) : path.resolve();
    options.project = options.project
        ? path.resolve(options.project)
        : path.resolve(options.rootDir, 'tsconfig.json');
}
