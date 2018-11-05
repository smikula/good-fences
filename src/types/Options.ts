import ValidationError from './ValidationError';

export default interface Options {
    project?: string;
    rootDir?: string;
    ignoreExternalFences?: boolean;
    onError?: (error: ValidationError) => void;
};
