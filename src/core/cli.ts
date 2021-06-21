import * as commander from 'commander';
import RawOptions from '../types/RawOptions';
import { run } from './runner';

// Read the package version from package.json
const packageVersion = require('../../package.json').version;

// Parse command line options
const program = commander
    .version(packageVersion)
    .option('-p, --project <string> ', 'tsconfig.json file')
    .option('-r, --rootDir <string...>', 'root directories of the project')
    .option(
        '-i, --ignoreExternalFences',
        'Whether to ignore external fences (e.g. those from node_modules)'
    )
    .option(
        '-c, --checkFiles <string...>',
        'Specific fences and source files to check. If unspecified, all files in rootDir will be checked.'
    );
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
