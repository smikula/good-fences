import NormalizedPath from './NormalizedPath';

export default interface Options {
    project: NormalizedPath;
    rootDir: NormalizedPath[];
    ignoreExternalFences: boolean;
}
