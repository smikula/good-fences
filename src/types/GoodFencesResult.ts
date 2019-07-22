import GoodFencesError from './GoodFencesError';
import ConfigWarning from './ConfigWarning';

export default interface GoodFencesResult {
    errors: GoodFencesError[];
    warnings: ConfigWarning[];
};
