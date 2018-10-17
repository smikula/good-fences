import NormalizedPath from './NormalizedPath';

export default interface NormalizedOptions {
    project: NormalizedPath;
    rootDir: NormalizedPath;
    requiredFences?: NormalizedPath[];
    onError?: (message: string) => void;
};
