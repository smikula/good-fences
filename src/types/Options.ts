import ValidationError from './ValidationError';

export default interface Options {
    project?: string;
    rootDir?: string;
    onError?: (error: ValidationError) => void;
};
