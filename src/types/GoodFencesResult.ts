import GoodFencesError from './GoodFencesError';
import GoodFencesWarning from './GoodFencesWarning';

export default interface GoodFencesResult {
    errors: GoodFencesError[];
    warnings: GoodFencesWarning[];
};
