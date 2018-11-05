import * as commander from 'commander';
import Options from '../types/Options';
import { run } from './runner';

// Read the package version from package.json
const packageVersion = require('../../package').version;

// Parse command line options
const options = commander
    .version(packageVersion)
    .option('-p, --project <string>', 'tsconfig.json file')
    .option('-r, --rootDir <string>', 'root directory of the project')
    .parse(process.argv) as Options;

let hadError = false;

// Run good-fences
run({
    ...options,
    onError(error) {
        console.error(error.detailedMessage);
        hadError = true;
    },
});

// Indicate success or failure via the exit code
process.exitCode = hadError ? 1 : 0;
