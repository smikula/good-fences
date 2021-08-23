import * as Git from 'nodegit';
import { loadConfigFromString } from './loadConfig';
import Config from '../types/config/Config';
import normalizePath from './normalizePath';
import NormalizedPath from '../types/NormalizedPath';
import { reportWarning } from '../core/result';
import { getScriptFileExtensions } from './getScriptFileExtensions';
import { FenceDiff, getFenceDiff } from './getFenceDiff';
import { getTsImportSetFromSourceString } from './getTsImportSetFromSourceString';

/**
 * Creates an empty fence given a path.
 *
 * Used when diffing fences against a fence that did not or no longer exists.
 */
function emptyFence(path: NormalizedPath): Config {
    return {
        tags: [],
        imports: null,
        exports: null,
        dependencies: null,
        path: path,
    };
}

async function resolveToCommit(
    repo: Git.Repository,
    compareOidOrRefName: string
): Promise<Git.Commit> {
    let oid: Git.Oid;
    try {
        oid = Git.Oid.fromString(compareOidOrRefName);
    } catch {
        oid = await Git.Reference.nameToId(repo, compareOidOrRefName);
    }
    return await Git.Commit.lookup(repo, oid);
}

/**
 * Given a nodegit Diff object, partitions it by path
 * into diffs between fences or script files. Ignores any paths
 * that are neither fences nor script files
 */
async function getFenceAndSourcePatches(diffSinceHash: Git.Diff, extensions: string[]) {
    const patches = await diffSinceHash.patches();
    const fencePatches = [];
    const sourcePatches = [];
    for (let patch of patches) {
        const oldFile = patch.oldFile();
        const newFile = patch.newFile();
        if (oldFile.path().endsWith('fence.json') || newFile.path().endsWith('fence.json')) {
            fencePatches.push(patch);
        } else if (
            extensions.some(
                scriptFileExtension =>
                    oldFile.path().endsWith(scriptFileExtension) ||
                    newFile.path().endsWith(scriptFileExtension)
            )
        ) {
            sourcePatches.push(patch);
        }
    }
    return [fencePatches, sourcePatches];
}

export type SourceImportDiff = {
    addedImports: string[];
    removedImports: string[];
};

export type FenceAndImportDiffs = {
    fenceDiffs: Map<NormalizedPath, FenceDiff>;
    sourceImportDiffs: Map<NormalizedPath, SourceImportDiff>;
};

/**
 * Given a git OID (commit hash) or ref name (refs/heads/master, HEAD~1),
 * finds the difference in script file imports and fence changes
 * between the current git index (e.g. staged set of files),
 * and the specified oid/refname.
 *
 * @param compareOidOrRefName an oid or refname
 * @returns The fence and import diffs
 */
export async function getFenceAndImportDiffsFromGit(
    compareOidOrRefName: string
): Promise<FenceAndImportDiffs | null> {
    const repo = await Git.Repository.open(process.cwd());
    const [index, headCommitTree, compareTree] = await Promise.all([
        repo.index(),
        repo.getHeadCommit().then(headCommit => headCommit?.getTree?.()),
        resolveToCommit(repo, compareOidOrRefName).then(commit => commit.getTree()),
    ]);

    let repoDiff: Git.Diff;
    const indexToHead = await Git.Diff.treeToIndex(repo, headCommitTree, null);
    const indexIsEmpty = indexToHead.numDeltas() === 0;

    // Permit all extensions in the extension set. If we are
    // overly-permissive here, the script files we detect for
    // checking should be filtered out while providing source
    // files.
    const mostPermissiveExtensionSet = getScriptFileExtensions({
        includeJson: true,
        jsx: true,
        allowJs: true,
        // This is used as a glob of for *${dotExt}, so .d.ts files
        // will be included in by the *.ts glob. Likewise for .d.tsx
        includeDefinitions: false,
    });

    if (!indexIsEmpty) {
        repoDiff = await Git.Diff.treeToIndex(repo, compareTree, index, {
            contextLines: 0,
            pathspec: mostPermissiveExtensionSet.map(dotExt => '*' + dotExt),
        });
    } else {
        repoDiff = await Git.Diff.treeToTree(repo, compareTree, headCommitTree, {
            contextLines: 0,
            pathspec: mostPermissiveExtensionSet.map(dotExt => '*' + dotExt),
        });
    }
    const [fencePatches, sourcePatches] = await getFenceAndSourcePatches(
        repoDiff,
        mostPermissiveExtensionSet
    );

    // TODO: track files across moves (Should just be a fence removal and addition)
    for (let patch of [...fencePatches, ...sourcePatches]) {
        if (patch.oldFile().path() && patch.oldFile().path() !== patch.newFile().path()) {
            reportWarning('Detected a moved fence or source file. Aborting partial check from git');
            return null;
        }
    }

    const fenceAndImportDiffs: FenceAndImportDiffs = {
        fenceDiffs: new Map(),
        sourceImportDiffs: new Map(),
    };

    const loadFencePatchesPromise = Promise.all(
        fencePatches.map(async fencePatch => {
            // an oid of zero means the object is not present in the
            // git db (e.g. it was deleted or did not yet exist)
            const newPath = !fencePatch.newFile().id().iszero()
                ? fencePatch.newFile().path()
                : null;
            const oldPath = !fencePatch.oldFile().id().iszero()
                ? fencePatch.oldFile().path()
                : null;

            const newFenceContentPromise: Promise<Config> | Config = newPath
                ? (async () => {
                      const indexEntry = await index.getByPath(newPath);
                      const newFenceBlob = await repo.getBlob(indexEntry.id);
                      return loadConfigFromString(
                          normalizePath(newPath),
                          newFenceBlob.content().toString('utf-8')
                      );
                  })()
                : emptyFence(normalizePath(oldPath));
            const oldFenceContentPromise: Promise<Config> | Config = oldPath
                ? (async () => {
                      const oldFenceEntry = await compareTree.getEntry(oldPath);
                      const oldFenceBlob = await oldFenceEntry.getBlob();
                      return loadConfigFromString(
                          normalizePath(oldPath),
                          oldFenceBlob.content().toString('utf-8')
                      );
                  })()
                : emptyFence(normalizePath(newPath));

            const [newFence, oldFence] = await Promise.all([
                newFenceContentPromise,
                oldFenceContentPromise,
            ]);

            const fenceDiff = getFenceDiff(oldFence, newFence);
            if (fenceDiff) {
                fenceAndImportDiffs.fenceDiffs.set(
                    normalizePath(fencePatch.newFile().path()),
                    fenceDiff
                );
            }
        })
    );

    const loadSourcePatchesPromise = Promise.all(
        sourcePatches.map(async sourcePatch => {
            // an oid of zero means the object is not present in the
            // git db (e.g. it was deleted or did not yet exist)
            const newPath = !sourcePatch.newFile().id().iszero()
                ? sourcePatch.newFile().path()
                : null;
            const oldPath = !sourcePatch.oldFile().id().iszero()
                ? sourcePatch.oldFile().path()
                : null;

            if (!newPath) {
                // only check files that actually exist now
                return;
            }

            const newSourceImportsPromise: Promise<Set<string>> | Set<string> = newPath
                ? (async () => {
                      const indexEntry = await index.getByPath(newPath);
                      const newSourceBlob = await repo.getBlob(indexEntry.id);
                      return getTsImportSetFromSourceString(
                          newSourceBlob.content().toString('utf-8')
                      );
                  })()
                : new Set();
            const oldSourceImportsPromise: Promise<Set<string>> | Set<string> = oldPath
                ? (async () => {
                      const oldSourceEntry = await compareTree.getEntry(oldPath);
                      const oldSourceBlob = await oldSourceEntry.getBlob();
                      return getTsImportSetFromSourceString(
                          oldSourceBlob.content().toString('utf-8')
                      );
                  })()
                : new Set();

            const [newSourceImports, oldSourceImports] = await Promise.all([
                newSourceImportsPromise,
                oldSourceImportsPromise,
            ]);

            const sourceImportDiff = {
                removedImports: [...oldSourceImports].filter(x => !newSourceImports.has(x)),
                addedImports: [...newSourceImports].filter(x => !oldSourceImports.has(x)),
            };

            if (
                sourceImportDiff.removedImports.length > 0 ||
                sourceImportDiff.addedImports.length > 0
            ) {
                fenceAndImportDiffs.sourceImportDiffs.set(
                    normalizePath(sourcePatch.newFile().path()),
                    sourceImportDiff
                );
            }
        })
    );

    await Promise.all([loadFencePatchesPromise, loadSourcePatchesPromise]);

    return fenceAndImportDiffs;
}
