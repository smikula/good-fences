import getOptions from '../utils/getOptions';
import ValidationError from '../types/ValidationError';
import getErrorString from '../utils/getErrorString';

export default function reportError(error: ValidationError) {
    if (getOptions().onError) {
        getOptions().onError(getErrorString(error), error);
    }
}
