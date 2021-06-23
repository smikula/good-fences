import * as Git from 'nodegit';
import ExportRule from '../types/config/ExportRule';
import { loadConfigFromString } from './loadConfig';
import Config from '../types/config/Config';
import normalizePath from './normalizePath';
import * as ts from 'typescript';
import { isImportDeclaration, ScriptTarget, SourceFile } from 'typescript';
import NormalizedPath from '../types/NormalizedPath';
import DependencyRule from '../types/config/DependencyRule';

function emptyFence(path: NormalizedPath): Config {
    return {
        tags: [],
        imports: [],
        exports: [],
        dependencies: [],
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

async function getFenceAndSourcePatches(repo: Git.Repository, commit: Git.Commit) {
    console.log('loading target tree..');
    const treeOnTarget = await commit.getTree();
    console.log('diffing target tree..');
    const diffSinceHash = await Git.Diff.treeToWorkdirWithIndex(repo, treeOnTarget, {
        contextLines: 0,
        pathspec: '*.json',
    });
    const patches = await diffSinceHash.patches();
    const fencePatches = [];
    const sourcePatches = [];
    for (let patch of patches) {
        const oldFile = patch.oldFile();
        const newFile = patch.newFile();
        console.log(oldFile.path(), newFile.path());
        if (oldFile.path().endsWith('fence.json') || newFile.path().endsWith('fence.json')) {
            fencePatches.push(patch);
        } else if (
            oldFile.path().endsWith('.ts') ||
            newFile.path().endsWith('.ts') ||
            oldFile.path().endsWith('.tsx') ||
            newFile.path().endsWith('.tsx')
        ) {
            sourcePatches.push(patch);
        }
    }
    return [fencePatches, sourcePatches];
}

export type FenceDiff = {
    addedExports: ExportRule[];
    addedImports: string[];
    removedExports: ExportRule[];
    removedImports: string[];
    addedDependencies: DependencyRule[];
    removedDependencies: DependencyRule[];
};

export type SourceImportDiff = {
    addedImports: string[];
    removedImports: string[];
};

export type FenceAndImportDiffs = {
    fenceDiffs: Map<NormalizedPath, FenceDiff>;
    sourceImportDiffs: Map<NormalizedPath, SourceImportDiff>;
};

const isSameExport = (exportA: ExportRule, exportB: ExportRule) => {
    return exportA.accessibleTo === exportB.accessibleTo && exportA.modules === exportB.modules;
};

const isSameDependencyRule = (dependencyA: DependencyRule, dependencyB: DependencyRule) => {
    return (
        dependencyA.accessibleTo === dependencyB.accessibleTo &&
        dependencyA.dependency === dependencyB.dependency
    );
};

function getFenceDiff(oldFence: Config, newFence: Config): FenceDiff | null {
    let diff: FenceDiff = {
        addedExports: [],
        removedExports: [],
        addedImports: [],
        removedImports: [],
        addedDependencies: [],
        removedDependencies: [],
    };
    let isDirty = false;
    for (let oldFenceExport of oldFence.exports) {
        if (
            !newFence.exports.some(newFenceExport => isSameExport(oldFenceExport, newFenceExport))
        ) {
            isDirty = true;
            diff.removedExports.push(oldFenceExport);
        }
    }
    for (let newFenceExport of newFence.exports) {
        if (
            !oldFence.exports.some(oldFenceExport => isSameExport(oldFenceExport, newFenceExport))
        ) {
            isDirty = true;
            diff.addedExports.push(newFenceExport);
        }
    }

    for (let oldFenceImport of oldFence.imports) {
        if (!newFence.imports.some(i => i == oldFenceImport)) {
            isDirty = true;
            diff.removedImports.push(oldFenceImport);
        }
    }
    for (let newFenceImport of newFence.imports) {
        if (!oldFence.imports.some(i => i == newFenceImport)) {
            isDirty = true;
            diff.addedImports.push(newFenceImport);
        }
    }

    for (let oldFenceDependency of oldFence.dependencies) {
        if (!newFence.dependencies.some(i => isSameDependencyRule(i, oldFenceDependency))) {
            isDirty = true;
            diff.removedDependencies.push(oldFenceDependency);
        }
    }
    for (let newFenceDependency of newFence.dependencies) {
        if (!oldFence.dependencies.some(i => isSameDependencyRule(i, newFenceDependency))) {
            isDirty = true;
            diff.addedDependencies.push(newFenceDependency);
        }
    }

    return isDirty ? diff : null;
}

function getTsImportSet(fileName: string, tsSource: string): Set<string> {
    const sourceFile: SourceFile = ts.createSourceFile(
        fileName,
        tsSource,
        ScriptTarget.Latest // langugeVersion
    );

    const importSet = new Set<string>();

    sourceFile.forEachChild(c => {
        if (isImportDeclaration(c)) {
            importSet.add(c.moduleSpecifier.getText());
        }
    });

    return importSet;
}

export async function getFenceAndImportDiffsFromGit(
    compareOidOrRefName: string
): Promise<FenceAndImportDiffs | null> {
    const repo = await Git.Repository.open(process.cwd());
    const compareCommit = await resolveToCommit(repo, compareOidOrRefName);
    const [fencePatches, sourcePatches] = await getFenceAndSourcePatches(repo, compareCommit);

    // if any folders or fences were moved, abort.
    // TODO: track files across moves
    for (let patch of [...fencePatches, ...sourcePatches]) {
        if (patch.oldFile().path() && patch.oldFile().path() !== patch.newFile().path()) {
            return null;
        }
    }

    const [index, compareTree] = await Promise.all([repo.index(), compareCommit.getTree()]);

    const fenceAndImportDiffs: FenceAndImportDiffs = {
        fenceDiffs: new Map(),
        sourceImportDiffs: new Map(),
    };

    const loadFencePatchesPromise = Promise.all(
        fencePatches.map(async fencePatch => {
            const newPath = fencePatch.newFile().path();
            const newPathNormalized = newPath && normalizePath(newPath);
            const oldPath = fencePatch.oldFile().path();
            const oldPathNormalized = oldPath && normalizePath(oldPath);

            const newFenceContentPromise: Promise<Config> | Config = newPathNormalized
                ? (async () => {
                      const indexEntry = await index.getByPath(newPathNormalized);
                      const newFenceBlob = await repo.getBlob(indexEntry.id);
                      return loadConfigFromString(
                          normalizePath(fencePatch.newFile().path()),
                          newFenceBlob.content().toString('utf-8')
                      );
                  })()
                : emptyFence(oldPathNormalized);
            const oldFenceContentPromise: Promise<Config> | Config = oldPathNormalized
                ? (async () => {
                      const oldFenceEntry = await compareTree.getEntry(oldPathNormalized);
                      const oldFenceBlob = await oldFenceEntry.getBlob();
                      return loadConfigFromString(
                          normalizePath(fencePatch.newFile().path()),
                          oldFenceBlob.content().toString('utf-8')
                      );
                  })()
                : emptyFence(oldPathNormalized);

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
        fencePatches.map(async sourcePatch => {
            const newPath = sourcePatch.newFile().path();
            const newPathNormalized = newPath && normalizePath(newPath);
            const oldPath = sourcePatch.oldFile().path();
            const oldPathNormalized = oldPath && normalizePath(oldPath);

            const newSourceImportsPromise: Promise<Set<string>> | Set<string> = newPathNormalized
                ? (async () => {
                      const indexEntry = await index.getByPath(newPathNormalized);
                      const newSourceBlob = await repo.getBlob(indexEntry.id);
                      return getTsImportSet(
                          normalizePath(newPathNormalized),
                          newSourceBlob.content().toString('utf-8')
                      );
                  })()
                : new Set();
            const oldSourceImportsPromise: Promise<Set<string>> | Set<string> = oldPathNormalized
                ? (async () => {
                      const oldSourceEntry = await compareTree.getEntry(oldPathNormalized);
                      const oldSourceBlob = await oldSourceEntry.getBlob();
                      return getTsImportSet(
                          normalizePath(oldPathNormalized),
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
                sourceImportDiff.removedImports.length > 0 &&
                sourceImportDiff.addedImports.length
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
