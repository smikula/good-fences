import NormalizedPath from './NormalizedPath';

export default interface NormalizedOptions {
    project: NormalizedPath;
    rootDir: NormalizedPath;
    onError?: (message: string) => void;
};
