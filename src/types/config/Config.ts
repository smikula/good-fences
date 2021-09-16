import NormalizedPath from '../NormalizedPath';
import DependencyRule from './DependencyRule';
import ExportRule from './ExportRule';

export default interface Config {
    path: NormalizedPath;
    tags: string[] | undefined;
    exports: ExportRule[] | undefined;
    dependencies: DependencyRule[] | undefined;
    imports: string[] | undefined;
}
