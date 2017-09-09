import * as fs from 'fs';

export default function getCompilerOptions() {
    const tsconfigJson = JSON.parse(fs.readFileSync('tsconfig.json').toString());
    return tsconfigJson.compilerOptions;
}
