import { reportWarning } from '../../core/result';
import NormalizedPath from '../../types/NormalizedPath';
import { FenceAndImportDiffs } from './getFenceAndImportDiffsFromGit';
import * as path from 'path';
import { PartialCheck } from '../../types/PartialCheck';

export function getPartialCheckFromImportDiffs(
    graphDiff: FenceAndImportDiffs
): PartialCheck | null {
    let fences = new Set<NormalizedPath>();
    let sourceFiles = new Set<NormalizedPath>();

    let canResolve = true;

    for (let [normalizedSourceFilePath, importDiff] of graphDiff.sourceImportDiffs.entries()) {
        if (importDiff.addedImports?.length) {
            // we need to re-check this file, since the new imports
            // might violate a parent fence of the file, or might
            // violate the exports rules of the fences of new modules
            // it is importing.
            sourceFiles.add(normalizedSourceFilePath);
        }
    }

    for (let [normalizedFencePath, fenceDiff] of graphDiff.fenceDiffs.entries()) {
        if (fenceDiff.exports?.removed?.length) {
            // if we removed an export, we have to re-evaluate all importers
            // which mean we can't resolve from the repo diff
            reportWarning(
                `Cannot perform partial evaluation -- removed export(s) ${fenceDiff.exports.removed
                    .map(x => {
                        const v = { ...x };
                        if (v.accessibleTo === null) {
                            delete v.accessibleTo;
                        }
                        return JSON.stringify(v);
                    })
                    .join(', ')} from fence ${path.relative(process.cwd(), normalizedFencePath)}`
            );
            canResolve = false;
        }

        const fenceHadExportsSectionAdded =
            fenceDiff.exports !== null &&
            fenceDiff.exports.removed === null &&
            fenceDiff.exports.added !== null;
        if (fenceHadExportsSectionAdded) {
            // if we added an exports section, we have to re-evaluate
            // all importers, which means we can't resolve from the repo diff
            reportWarning(
                `Cannot perform partial evaluation -- added an exports section to fence ${normalizedFencePath}`
            );
            canResolve = false;
        }

        const fenceHadImportsSectionAdded =
            fenceDiff.imports !== null &&
            fenceDiff.imports.removed === null &&
            fenceDiff.imports.added !== null;
        const fenceHadImportsRemoved = fenceDiff.imports?.removed?.length;
        if (fenceHadImportsRemoved || fenceHadImportsSectionAdded) {
            // Forces a check on all fence children
            fences.add(normalizedFencePath);
        }

        const fenceHadDependenciesRemoved = fenceDiff.dependencies?.removed?.length;
        const fenceHadDependenciesSectionAdded =
            fenceDiff.dependencies !== null &&
            fenceDiff.dependencies.removed === null &&
            fenceDiff.dependencies.added !== null;
        if (fenceHadDependenciesRemoved || fenceHadDependenciesSectionAdded) {
            // Forces a check on all fence children
            fences.add(normalizedFencePath);
        }

        const fenceHadTagsRemoved = fenceDiff.tags?.removed?.length;
        if (fenceHadTagsRemoved) {
            // There might exist another fence that references the removed tag in
            // an imports section, which would make imports that depend on that
            // tag invalid.
            reportWarning(
                `Cannot perform partial evaluation -- removed tags from fence ${normalizedFencePath}`
            );
            canResolve = false;
        }
    }

    if (!canResolve) {
        return null;
    }

    return {
        fences: [...fences],
        sourceFiles: [...sourceFiles],
    };
}
