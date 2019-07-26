import RawDependencyRule from './RawDependencyRule';
import RawExportRule from './RawExportRule';
import LegacyExportRules from './LegacyExportRules';

export default interface RawConfig {
    tags?: string[];
    exports?: RawExportRule[] | LegacyExportRules;
    dependencies?: RawDependencyRule[];
    imports?: string[];
};
