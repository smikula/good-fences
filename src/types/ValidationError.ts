export default interface ValidationError {
    message: string;
    sourceFile: string;
    rawImport: string;
    fencePath: string;
    detailedMessage: string;
};
