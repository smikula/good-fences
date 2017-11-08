import NormalizedPath from './NormalizedPath';

export default interface Options {
    project?: NormalizedPath;
    rootDir?: NormalizedPath;
    onError?: (message: string) => void;
};
