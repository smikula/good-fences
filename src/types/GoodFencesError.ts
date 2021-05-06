export default interface GoodFencesError {
    message: string;
    sourceFile?: string;
    rawImport?: string;
    fencePath: string;
    detailedMessage: string;
}
