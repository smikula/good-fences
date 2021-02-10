import RawDependencyRule from './RawDependencyRule';
import RawExportRule from './RawExportRule';
import RawTagRule from './RawTagRule';

export default interface RawConfig {
    tags?: RawTagRule[];
    exports?: RawExportRule[];
    dependencies?: RawDependencyRule[];
    imports?: string[];
}
