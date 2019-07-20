import * as commander from 'commander';
import RawOptions from '../types/RawOptions';
import { run } from './runner';

// Read the package version from package.json
const packageVersion = require('../../package').version;

// Parse command line options
const options = commander
    .version(packageVersion)
    .option('-p, --project <string>', 'tsconfig.json file')
    .option('-r, --rootDir <string>', 'root directory of the project')
    .parse(process.argv) as RawOptions;

// Run good-fences
const result = run(options);

// Write errors to the console
for (const error of result.errors) {
    console.error(error.detailedMessage);
}

// Indicate success or failure via the exit code
process.exitCode = result.errors.length > 0 ? 1 : 0;
