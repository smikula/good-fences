import DependencyRule from './RawDependencyRule';

export default interface RawConfig {
    tags?: string[];
    exports?: { [files: string]: string | string[] };
    dependencies?: DependencyRule[];
    imports?: string[];
    requiredFences?: string[];
};
