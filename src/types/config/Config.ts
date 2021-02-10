import NormalizedPath from '../NormalizedPath';
import DependencyRule from './DependencyRule';
import ExportRule from './ExportRule';
import TagRule from './TagRule';

export default interface Config {
    path: NormalizedPath;
    tags: TagRule[];
    exports: ExportRule[];
    dependencies: DependencyRule[];
    imports: string[];
};
