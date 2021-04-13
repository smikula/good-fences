import * as commander from 'commander';
import RawOptions from '../types/RawOptions';
import { run } from './runner';

// Read the package version from package.json
const packageVersion = require('../../package.json').version;

// Parse command line options
const program = commander
    .version(packageVersion)
    .option('-p, --project <string> ', 'tsconfig.json file')
    .option('-r, --rootDir <string...>', 'root directories of the project');
program.parse(process.argv);
const options = program.opts() as RawOptions;

// Run good-fences
const result = run(options);

// Write results to the console
for (const error of result.errors) {
    console.error(error.detailedMessage);
}

for (const warning of result.warnings) {
    console.error(warning.detailedMessage);
}

// Indicate success or failure via the exit code
process.exitCode = result.errors.length > 0 ? 1 : 0;
