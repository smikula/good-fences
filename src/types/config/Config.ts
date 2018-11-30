import NormalizedPath from '../NormalizedPath';
import DependencyRule from './DependencyRule';
import ExportRule from './ExportRule';

export default interface Config {
    path: NormalizedPath;
    tags: string[];
    exports: ExportRule[];
    dependencies: DependencyRule[];
    imports: string[];
};
