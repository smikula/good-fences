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
            '-x, --looseRootFileDiscovery',
            '(UNSTABLE) Check source files under rootDirs instead of instantiating a full typescript program.'
        )
        .option(
            '-i, --ignoreExternalFences',
            'Whether to ignore external fences (e.g. those from node_modules)'
        )
        .option(
            '-c, --checkFiles <string...>',
            'Specific fences and source files to check. If unspecified, all files in rootDir will be checked.'
        )
        .option(
            '-g, --sinceGitHash <string>',
            'Infer files and fences to check based on changes since the last git hash'
        )
        .option(
            '-l, --partialCheckLimit <number>',
            'Maximum files to check during a partial check run. If more files than this limit are changed, the partial check will be aborted and good-fences will exit with code 0.'
        );
    program.parse(process.argv);
    const options = program.opts() as RawOptions;

    // Run good-fences
    console.log('finished commander args at', process.uptime());
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

console.log('finished parse after', process.uptime());

const inspector = require('inspector');
const session = new inspector.Session();
session.connect();

main().catch(e => {
    console.error('Error while running fences:', e);
    console.log(e.stack);
    console.log(require('util').inspect(e, { depth: 11 }));
    process.exit(1);
});

// session.post('Profiler.enable', () => {
//     session.post('Profiler.start', () => {
//         // Invoke business logic under measurement here...
//         main()
//             // .catch(e => {
//             //     console.error('Error while running fences:', e, e.stack);
//             //     process.exit(1);
//             // })
//             .then(() => {
//                 // some time later...
//                 session.post('Profiler.stop', (err: any, { profile }: { profile: any }) => {
//                     // Write profile to disk, upload, etc.
//                     if (!err) {
//                         require('fs').writeFileSync(
//                             './profile.cpuprofile',
//                             JSON.stringify(profile)
//                         );
//                     }
//                 });
//             });
//     });
// });
