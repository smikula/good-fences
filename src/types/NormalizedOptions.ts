import NormalizedPath from './NormalizedPath';

export default interface NormalizedOptions {
    project: NormalizedPath;
    rootDir: NormalizedPath;
    ignoreExternalFences: boolean;
    onError?: (message: string) => void;
};
