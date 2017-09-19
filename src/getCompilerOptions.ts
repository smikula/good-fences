import * as fs from 'fs';

let compilerOptions;

export default function getCompilerOptions() {
    if (!compilerOptions) {
        const tsconfigJson = JSON.parse(fs.readFileSync('tsconfig.json').toString());
        compilerOptions = tsconfigJson.compilerOptions;
    }

    return compilerOptions;
}
