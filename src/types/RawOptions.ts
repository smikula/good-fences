import ValidationError from './ValidationError';

export default interface RawOptions {
    project?: string;
    rootDir?: string;
    ignoreExternalFences?: boolean;
    onError?: (error: ValidationError) => void;
};
