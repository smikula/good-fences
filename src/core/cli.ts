import * as commander from 'commander';
import RawOptions from '../types/RawOptions';
import { run } from './runner';

async function main() {
    // Read the package version from package.json
    const packageVersion = require('../../package.json').version;

    // Parse command line options
    const program = commander
        .version(packageVersion)
        .option('-p, --project <string> ', 'tsconfig.json file')
        .option('-r, --rootDir <string...>', 'root directories of the project')
        .option(
            '-g, --sinceGitHash <string>',
            'Infer files and fences to check based on changes since the specified git hash'
        )
        .option(
            '-l, --partialCheckLimit <number>',
            'Maximum files to check during a partial check run. If more files than this limit are changed, the partial check will be aborted and good-fences will exit with code 0.'
        )
        .option(
            '-j, --maxConcurrentFenceJobs',
            'Maximum number of concurrent fence jobs to run. Default 6000'
        )
        .option('-b, --progressBar', 'Show a progress bar while evaluating fences');
    program.parse(process.argv);
    const options = program.opts() as RawOptions;

    // Run good-fences
    const result = await run(options);

    // Write results to the console
    for (const error of result.errors) {
        console.error(error.detailedMessage);
    }

    for (const warning of result.warnings) {
        console.error(warning.detailedMessage);
    }

    // Indicate success or failure via the exit code
    process.exitCode = result.errors.length > 0 ? 1 : 0;
}

main().catch(e => {
    console.error('Error while running fences:', e.stack);
    process.exit(1);
});
