import Options from './types/Options';
import normalizePath from './normalizePath';

let options: Options;

export default function getOptions() {
    return options;
}

export function setOptions(providedOptions: Options) {
    options = providedOptions;

    // Normalize and apply defaults
    options.rootDir = normalizePath(options.rootDir || process.cwd());
    options.project = options.project
        ? normalizePath(options.project)
        : normalizePath(options.rootDir, 'tsconfig.json');
}
