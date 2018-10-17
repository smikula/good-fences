import reportError from '../core/reportError';
import * as glob from 'glob';
import * as path from 'path';
import getOptions from '../utils/getOptions';
import normalizePath from '../utils/normalizePath';
import getAllConfigs from '../utils/getAllConfigs';

export default function validateFencesExistence() {
    if (!getOptions().requiredFences) {
        return true;
    }
    const configPaths = getAllConfigs();

    // get a deduped list of required paths
    const requiredPaths = Array.from(
        new Set([].concat(...getOptions().requiredFences.map(f => glob.sync(f))))
    );

    // get the required paths that aren't in our map of all configs
    const missingRequiredPaths = requiredPaths.filter(
        p => configPaths[normalizePath(path.dirname(p))]
    );

    if (missingRequiredPaths.length > 0) {
        missingRequiredPaths.forEach(p => reportError(`Missing fence.json at ${p}`));
    }

    return missingRequiredPaths.length === 0;
}
