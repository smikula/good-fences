import * as path from 'path';
import getOptions from './getOptions';

export default function getProjectFile() {
    let options = getOptions();
    if (options.project) {
        return options.project;
    }

    if (options.rootDir) {
        return path.resolve(options.rootDir, 'tsconfig.json');
    }

    return 'tsconfig.json';
}
