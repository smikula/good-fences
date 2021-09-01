import type Config from '../../types/config/Config';
import type DependencyRule from '../../types/config/DependencyRule';
import type ExportRule from '../../types/config/ExportRule';

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
    tags: DiffList<string> | null;
    exports: DiffList<ExportRule> | null;
    imports: DiffList<string> | null;
    dependencies: DiffList<DependencyRule> | null;
};

type DiffList<T> = {
    /**
     * The list of new entries in the new version of the list.
     *
     * If there is no new version of the list (e.g. the list was
     * deleted in this change), this will be null.
     */
    added: T[] | null;
    /**
     * The list of old entries in the old version of the list.
     *
     * If there was no old version of the list (e.g. the list was
     * introduced in this change), this will be null.
     */
    removed: T[] | null;
};

/**
 * Gets a difference between the entries of the previous and new list.
 *
 * @param oldList - the old list, or null if the old list did not exist
 * @param newList - the new list, or null if the old list did not exist
 * @param checkIsSame - a method for comparing objects (e.g. for equivalent
 *   objects that are not referentially equal)
 * @returns a DiffList
 */
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
            added: [],
            removed: [],
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

/**
 * Gets the difference between two fences, which can be used to calculate a partial
 * set of fences and source files that need to be re-checked.
 *
 * Each entry of the resuting FenceDiff object will be a DiffList with an added: and removed:
 * section that hold the added and removed list entries. If the list itself was added or
 * removed the new list will be in the corresponding added: or removed: section, and the
 * other entry will be null.
 *
 * @see DiffList
 */
export function getFenceDiff(oldFence: Config, newFence: Config): FenceDiff | null {
    let diff: FenceDiff = {
        tags: diffList(oldFence.tags, newFence.tags, (a: string, b: string) => a === b),
        exports: diffList(oldFence.exports, newFence.exports, isSameExport),
        imports: diffList(oldFence.imports, newFence.imports, (a: string, b: string) => a === b),
        dependencies: diffList(oldFence.dependencies, newFence.dependencies, isSameDependencyRule),
    };

    if (diff.exports === null && diff.imports === null && diff.dependencies === null) {
        return null;
    }

    return diff;
}
