import NormalizedPath from './NormalizedPath';
import GoodFencesError from './GoodFencesError';

export default interface Options {
    project: NormalizedPath;
    rootDir: NormalizedPath;
    ignoreExternalFences: boolean;
    onError?: (error: GoodFencesError) => void;
};
