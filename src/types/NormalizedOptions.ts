import NormalizedPath from './NormalizedPath';

export default interface NormalizedOptions {
    project: NormalizedPath;
    rootDir: NormalizedPath;
    ignoreNodeModules: boolean;
    onError?: (message: string) => void;
};
