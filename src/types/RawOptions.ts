import GoodFencesError from './GoodFencesError';

export default interface RawOptions {
    project?: string;
    rootDir?: string;
    ignoreExternalFences?: boolean;
    onError?: (error: GoodFencesError) => void;
};
