import RawOptions from '../types/RawOptions';
import getOptions, { setOptions } from '../utils/getOptions';
import validateFile from '../validation/validateFile';
import TypeScriptProgram from './TypeScriptProgram';
import normalizePath from '../utils/normalizePath';
import { getResult } from './result';
import { validateTagsExist } from '../validation/validateTagsExist';
import GoodFencesError from '../types/GoodFencesError';
import { ViolationType } from '../types/ViolationType';
import GoodFencesResult from '../types/GoodFencesResult';
import { readFileSync, writeFileSync, existsSync } from 'fs';

export function run(rawOptions: RawOptions, files?: string[]) {
    // Store options so they can be globally available
    setOptions(rawOptions);

    // Do some sanity checks on the fences
    validateTagsExist();

    // Run validation
    // if no files passed in, process the whole folder
    let tsProgram = new TypeScriptProgram(getOptions().project);
    if (!files || files.length === 0) {
        files = tsProgram.getSourceFiles();
    } else {
        // filter out non ts files and invalid files
        files = files.filter(fileName => existsSync(fileName) && fileName.endsWith('.ts'));
    }

    files.forEach(file => {
        validateFile(normalizePath(file), tsProgram);
    });

    if (getOptions().fixImportsAndDependencies) {
        return fixImportsAndDependencies(getResult());
    } else {
        return getResult();
    }
}

function fixImportsAndDependencies(result: GoodFencesResult) {
    // initialResults is a map of fence file path (string) => violations ({import: string, violationType: ViolationType}) for that fence file
    const initialResults: { [key: string] : Violation[] } = {};
    const reducedResults = result.errors.reduce(reduceErrorsToMap, initialResults);

    Object.keys(reducedResults).forEach(fenceFile => {
        const config = JSON.parse(readFileSync(fenceFile).toString());
        // add imports to the imports section
        if (config.imports) {
            const importViolations = reducedResults[fenceFile].filter(violation => violation.violationType === ViolationType.Import).map(violation => violation.import);
            config.imports = (config.imports).concat(...importViolations);
            config.imports = config.imports.sort();
        }

        // add dependencies to the dependencies section
        if (config.dependencies) {
            const dependencyViolations = reducedResults[fenceFile].filter(violation => violation.violationType === ViolationType.Dependency).map(violation => violation.import);
            config.dependencies = (config.dependencies).concat(...dependencyViolations);
            config.dependencies = config.dependencies.sort();
        }

        if (config.imports || config.dependencies) {
            writeFileSync(fenceFile, JSON.stringify(config, null, 2));
        }
    })

    // since we handled the import and dependency errors, remove them from the error results
    result.errors = result.errors.filter(error => error.violationType !== ViolationType.Import && error.violationType !== ViolationType.Dependency);

    return result;
}

interface Violation {
    import: string;
    violationType: ViolationType;
}

function reduceErrorsToMap(total: { [key: string] : Violation[] }, currentValue: GoodFencesError): { [key: string] : Violation[] } {
    const fence = currentValue.fencePath;
    if (!total[fence]) {
        total[fence] = [];
    }

    const existingMatches = total[fence].filter(violation => violation.import === currentValue.rawImport && violation.violationType === currentValue.violationType);

    if (existingMatches.length == 0) {
        total[fence].push({
            import: currentValue.rawImport,
            violationType: currentValue.violationType
        });
    }

    return total;
}