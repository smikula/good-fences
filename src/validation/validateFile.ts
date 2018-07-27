import NormalizedPath from '../types/NormalizedPath';
import TypeScriptProgram from '../core/TypeScriptProgram';
import validateExportRules from './validateExportRules';
import getImportsFromFile from '../utils/getImportsFromFile';
import validateDependencyRules from './validateDependencyRules';
import validateImportRules from './validateImportRules';

export default function validateFile(filePath: NormalizedPath, tsProgram: TypeScriptProgram) {
    const imports = getImportsFromFile(filePath, tsProgram);
    for (let importRecord of imports) {
        validateExportRules(filePath, importRecord.filePath);

        if (importRecord.isExternal) {
            // External dependency, so apply dependency rules
            validateDependencyRules(filePath, importRecord);
        } else {
            // Internal dependency, so apply import rules
            validateImportRules(filePath, importRecord);
        }
    }
}
