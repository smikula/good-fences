import Path from './Path';

export default interface Options {
    project?: Path;
    rootDir?: Path;
    onError?: (message: string) => void;
};
