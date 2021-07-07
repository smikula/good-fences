import { reportWarning } from '../core/result';
import NormalizedPath from '../types/NormalizedPath';
import Options from '../types/Options';
import { FenceAndImportDiffs } from './getFenceAndImportDiffsFromGit';
import * as path from 'path';

export async function getPartialCheckFromImportDiffs(
    graphDiff: FenceAndImportDiffs
): Promise<Options['partialCheck']> {
    let fences = new Set<NormalizedPath>();
    let sourceFiles = new Set<NormalizedPath>();

    let canResolve = true;

    await Promise.all(
        [...graphDiff.sourceImportDiffs.entries()].map(
            async ([normalizedSourceFilePath, importDiff]) => {
                if (importDiff.addedImports) {
                    // we need to re-check this file, since the new imports
                    // might violate the importing fence.
                    sourceFiles.add(normalizedSourceFilePath);
                }
                // TODO: I don't think we actually need to do this, since
                // we resolve imports and check all fences against each import
                // since each import is validated when we validateExportRules.
                //
                // for (let newImport of importDiff.addedImports) {
                //     // If a new import was added, we need to check
                //     // each of the imported files
                //     const resolvedImportedFile = await sourceProvider.resolveImportFromFile(
                //         normalizedSourceFilePath,
                //         newImport
                //     );
                //     sourceFiles.add(normalizePath(resolvedImportedFile));
                // }
            }
        )
    );

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
