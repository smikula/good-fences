import DependencyRule from '../DependencyRule';

export default interface RawConfig {
    tags?: string[];
    exports?: { [files: string]: string | string[] };
    dependencies?: DependencyRule[];
    imports?: string[];
};
