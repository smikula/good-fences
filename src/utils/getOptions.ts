import Options from '../types/Options';
import NormalizedOptions from '../types/NormalizedOptions';
import normalizePath from './normalizePath';

let options: NormalizedOptions;

export default function getOptions() {
    return options;
}

export function setOptions(providedOptions: Options) {
    // Normalize and apply defaults
    const rootDir = normalizePath(providedOptions.rootDir || process.cwd());
    const project = providedOptions.project
        ? normalizePath(providedOptions.project)
        : normalizePath(rootDir, 'tsconfig.json');

    options = {
        project,
        rootDir,
        onError: providedOptions.onError,
    };
}
