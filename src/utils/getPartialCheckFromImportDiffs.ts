import { reportWarning } from '../core/result';
import NormalizedPath from '../types/NormalizedPath';
import { FenceAndImportDiffs } from './getFenceAndImportDiffsFromGit';
import * as path from 'path';
import { PartialCheck } from '../types/PartialCheck';

export function getPartialCheckFromImportDiffs(graphDiff: FenceAndImportDiffs): PartialCheck {
    let fences = new Set<NormalizedPath>();
    let sourceFiles = new Set<NormalizedPath>();

    let canResolve = true;

    for (let [normalizedSourceFilePath, importDiff] of graphDiff.sourceImportDiffs.entries()) {
        if (importDiff.addedImports) {
            // we need to re-check this file, since the new imports
            // might violate the importing fence.
            sourceFiles.add(normalizedSourceFilePath);
        }
    }

    for (let [normalizedFencePath, fenceDiff] of graphDiff.fenceDiffs.entries()) {
        if (fenceDiff.removedExports.length) {
            // if we removed an export, we have to re-evaluate all importers
            // which mean we can't resolve from the repo diff
            reportWarning(
                `Cannot perform partial evaluation -- removed export(s) ${fenceDiff.removedExports
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
        if (fenceDiff.removedImports.length) {
            // add this to the fence set: this will force us to check all source files
            // in the scope of the fence.
            fences.add(normalizedFencePath);
        }
        if (fenceDiff.removedDependencies.length) {
            // add this to the fence set: this will force us to check all source files
            // in the scope of the fence.
            fences.add(normalizedFencePath);
        }
    }

    if (!canResolve) {
        return undefined;
    }

    return {
        fences: [...fences],
        sourceFiles: [...sourceFiles],
    };
}
