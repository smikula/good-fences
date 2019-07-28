import * as fs from 'fs';
import * as glob from 'glob';
import RawConfig from './types/rawConfig/RawConfig';

const files = glob.sync('**/fence.json');
for (const file of files) {
    let rawConfig: RawConfig = JSON.parse(fs.readFileSync(file).toString());

    if (rawConfig.exports && !Array.isArray(rawConfig.exports)) {
        const exports = rawConfig.exports;
        rawConfig.exports = Object.keys(exports).map(key => {
            let accessibleTo = exports[key];
            if (accessibleTo == '*') {
                return key;
            }

            return {
                modules: key,
                accessibleTo,
            };
        });

        fs.writeFileSync(file, JSON.stringify(rawConfig, null, 4));
    }
}
