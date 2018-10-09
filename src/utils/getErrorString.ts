import ValidationError from '../types/ValidationError';

export default function getErrorString(error: ValidationError) {
    switch (error.kind) {
        case 'DependencyError':
        case 'ImportError':
            return `${error.sourceFile} is not allowed to import '${error.rawImport}'`;
        case 'ExportError':
            return `${error.sourceFile} is importing inaccessible module ${error.importFile}`;
        default:
            return ((): never => {
                throw error;
            })();
    }
}
