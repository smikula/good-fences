import NormalizedPath from './NormalizedPath';
import DependencyRule from './DependencyRule';

export default interface Config {
    path: NormalizedPath;
    tags?: string[];
    exports?: { [files: string]: string | string[] };
    dependencies?: DependencyRule[];
    imports?: string[];
};
