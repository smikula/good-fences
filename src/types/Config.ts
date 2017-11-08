import Path from './Path';

export default interface Config {
    path: Path;
    tags?: string[];
    exports?: { [files: string]: string | string[] };
};
