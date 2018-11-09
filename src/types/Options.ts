import NormalizedPath from './NormalizedPath';
import ValidationError from './ValidationError';

export default interface Options {
    project: NormalizedPath;
    rootDir: NormalizedPath;
    ignoreExternalFences: boolean;
    onError?: (error: ValidationError) => void;
};
