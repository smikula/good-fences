import NormalizedPath from '../types/NormalizedPath';
import TypeScriptProgram from '../core/TypeScriptProgram';
import validateExportRules from './validateExportRules';
import getImportsFromFile from '../utils/getImportsFromFile';

export default function validateFile(filePath: NormalizedPath, tsProgram: TypeScriptProgram) {
    const imports = getImportsFromFile(filePath, tsProgram);
    for (let importRecord of imports) {
        validateExportRules(filePath, importRecord.filePath);
    }
}
