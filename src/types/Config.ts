import NormalizedPath from './NormalizedPath';

export default interface Config {
    path: NormalizedPath;
    tags?: string[];
    exports?: { [files: string]: string | string[] };
    dependencies?: string[];
    imports?: string[];
};
