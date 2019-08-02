import RawOptions from '../types/RawOptions';
import Options from '../types/Options';
import normalizePath from './normalizePath';

let options: Options;

export default function getOptions() {
    return options;
}

export function setOptions(rawOptions: RawOptions) {
    // Normalize and apply defaults
    const rootDir = normalizePath(rawOptions.rootDir || process.cwd());
    const project = rawOptions.project
        ? normalizePath(rawOptions.project)
        : normalizePath(rootDir, 'tsconfig.json');

    options = {
        project,
        rootDir,
        ignoreExternalFences: rawOptions.ignoreExternalFences,
    };
}
