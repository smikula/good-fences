import ValidationError from './ValidationError';

export default interface GoodFencesResult {
    errors: ValidationError[];
    warnings: ValidationError[];
};
