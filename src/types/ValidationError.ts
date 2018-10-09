import NormalizedPath from "./NormalizedPath";

export interface DependencyError {
    kind: 'DependencyError';
    sourceFile: NormalizedPath;
    rawImport: string;
}

export interface ExportError {
    kind: 'ExportError';
    sourceFile: NormalizedPath;
    importFile: NormalizedPath;
}

export interface ImportError {
    kind: 'ImportError';
    sourceFile: NormalizedPath;
    rawImport: string;
}

type ValidationError = DependencyError | ExportError | ImportError;

export default ValidationError;