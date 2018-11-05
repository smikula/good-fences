import NormalizedPath from './NormalizedPath';
import ValidationError from './ValidationError';

export default interface NormalizedOptions {
    project: NormalizedPath;
    rootDir: NormalizedPath;
    ignoreExternalFences: boolean;
    onError?: (error: ValidationError) => void;
};
