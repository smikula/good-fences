import NormalizedPath from '../NormalizedPath';
import DependencyRule from './DependencyRule';
import ExportRule from './ExportRule';

export default interface Config {
    path: NormalizedPath;
    tags: string[] | null;
    exports: ExportRule[] | null;
    dependencies: DependencyRule[] | null;
    imports: string[] | null;
}
