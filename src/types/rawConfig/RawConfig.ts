import RawDependencyRule from './RawDependencyRule';

export default interface RawConfig {
    tags?: string[];
    exports?: { [files: string]: string | string[] };
    dependencies?: RawDependencyRule[];
    imports?: string[];
    requiredFences?: string[];
};
