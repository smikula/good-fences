import GoodFencesError from './GoodFencesError';

export default interface GoodFencesResult {
    errors: GoodFencesError[];
    warnings: GoodFencesError[];
}
