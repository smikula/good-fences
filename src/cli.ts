import * as commander from 'commander';
import Options from './types/Options';
import { run } from './runner';

// Read the package version from package.json
const packageVersion = require('../package').version;

// Parse command line options
const options = commander
    .version(packageVersion)
    .option('-p, --project <string>', 'tsconfig.json file')
    .option('-r, --rootDir <string>', 'root directory of the project')
    .parse(process.argv) as Options;

// Run good-fences
run(options);
