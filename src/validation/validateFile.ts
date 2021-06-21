import NormalizedPath from '../types/NormalizedPath';
import validateExportRules from './validateExportRules';
import getImportsFromFile from '../utils/getImportsFromFile';
import validateDependencyRules from './validateDependencyRules';
import validateImportRules from './validateImportRules';
import { SourceFileProvider } from '../core/SourceFileProvider';

export default async function validateFile(
    filePath: NormalizedPath,
    fileProvider: SourceFileProvider
) {
    const imports = await getImportsFromFile(filePath, fileProvider);
    for (let importRecord of imports) {
        validateExportRules(filePath, importRecord);

        if (importRecord.isExternal) {
            // External dependency, so apply dependency rules
            validateDependencyRules(filePath, importRecord);
        } else {
            // Internal dependency, so apply import rules
            validateImportRules(filePath, importRecord);
        }
    }
}
