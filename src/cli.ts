import * as commander from 'commander';
import { run } from './runner';

// Read the package version from package.json
let packageVersion = require('../package').version;

commander
    .version(packageVersion)
    .option('-p, --project <string>', 'tsconfig.json file')
    .parse(process.argv);

run();
