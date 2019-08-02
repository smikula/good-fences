import RawDependencyRule from './RawDependencyRule';
import RawExportRule from './RawExportRule';

export default interface RawConfig {
    tags?: string[];
    exports?: RawExportRule[];
    dependencies?: RawDependencyRule[];
    imports?: string[];
}
