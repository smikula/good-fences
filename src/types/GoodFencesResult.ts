import ValidationError from './ValidationError';
import ConfigWarning from './ConfigWarning';

export default interface GoodFencesResult {
    errors: ValidationError[];
    warnings: ConfigWarning[];
};
