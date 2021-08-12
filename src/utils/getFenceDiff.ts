import Config from '../types/config/Config';
import DependencyRule from '../types/config/DependencyRule';
import ExportRule from '../types/config/ExportRule';

const isSameExport = (exportA: ExportRule, exportB: ExportRule) => {
    return exportA.accessibleTo === exportB.accessibleTo && exportA.modules === exportB.modules;
};

const isSameDependencyRule = (dependencyA: DependencyRule, dependencyB: DependencyRule) => {
    return (
        dependencyA.accessibleTo === dependencyB.accessibleTo &&
        dependencyA.dependency === dependencyB.dependency
    );
};

export type FenceDiff = {
    exports: {
        added: ExportRule[] | null;
        removed: ExportRule[] | null;
    } | null;
    imports: {
        added: string[] | null;
        removed: string[] | null;
    } | null;
    dependencies: {
        added: DependencyRule[] | null;
        removed: DependencyRule[] | null;
    } | null;
};

type DiffList<T> = {
    added: T[] | null;
    removed: T[] | null;
};

export function diffList<T>(
    oldList: T[] | null,
    newList: T[] | null,
    checkIsSame: (a: T, b: T) => boolean
): DiffList<T> | null {
    if (newList && !oldList) {
        return {
            added: [...newList],
            removed: null,
        };
    } else if (oldList && !newList) {
        return {
            added: null,
            removed: [...oldList],
        };
    } else if (!oldList && !newList) {
        // no diff (null -> null)
        return null;
    } else {
        let listDiff: DiffList<T> = {
            added: newList === null ? null : [],
            removed: oldList === null ? null : [],
        };

        // both lists had content, diff them
        for (let oldListEntry of oldList) {
            if (!newList.some(checkIsSame.bind(null, oldListEntry))) {
                listDiff.removed.push(oldListEntry);
            }
        }

        for (let newListEntry of newList) {
            if (!oldList.some(checkIsSame.bind(null, newListEntry))) {
                listDiff.added.push(newListEntry);
            }
        }

        return listDiff.added.length || listDiff.removed.length ? listDiff : null;
    }
}

export function getFenceDiff(oldFence: Config, newFence: Config): FenceDiff | null {
    let diff: FenceDiff = {
        exports: diffList(oldFence.exports, newFence.exports, isSameExport),
        imports: diffList(oldFence.imports, newFence.imports, (a: string, b: string) => a === b),
        dependencies: diffList(oldFence.dependencies, newFence.dependencies, isSameDependencyRule),
    };

    if (diff.exports === null && diff.imports === null && diff.dependencies === null) {
        return null;
    }

    return diff;
}
