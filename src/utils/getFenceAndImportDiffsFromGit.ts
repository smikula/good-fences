import * as Git from 'nodegit';
import ExportRule from '../types/config/ExportRule';
import { loadConfigFromString } from './loadConfig';
import Config from '../types/config/Config';
import normalizePath from './normalizePath';
import * as ts from 'typescript';
import { isImportDeclaration, ScriptTarget, SourceFile } from 'typescript';
import NormalizedPath from '../types/NormalizedPath';
import DependencyRule from '../types/config/DependencyRule';
import { reportWarning } from '../core/result';

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

async function getFenceAndSourcePatches(diffSinceHash: Git.Diff) {
    const patches = await diffSinceHash.patches();
    const fencePatches = [];
    const sourcePatches = [];
    for (let patch of patches) {
        const oldFile = patch.oldFile();
        const newFile = patch.newFile();
        if (oldFile.path().endsWith('fence.json') || newFile.path().endsWith('fence.json')) {
            fencePatches.push(patch);
        } else if (
            oldFile.path().endsWith('.ts') ||
            newFile.path().endsWith('.tsx') ||
            oldFile.path().endsWith('.js') ||
            newFile.path().endsWith('.jsx')
        ) {
            sourcePatches.push(patch);
        } else {
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
    for (let oldFenceExport of oldFence.exports || []) {
        if (
            !(newFence.exports || []).some(newFenceExport =>
                isSameExport(oldFenceExport, newFenceExport)
            )
        ) {
            isDirty = true;
            diff.removedExports.push(oldFenceExport);
        }
    }
    for (let newFenceExport of newFence.exports || []) {
        if (
            !(oldFence.exports || []).some(oldFenceExport =>
                isSameExport(oldFenceExport, newFenceExport)
            )
        ) {
            isDirty = true;
            diff.addedExports.push(newFenceExport);
        }
    }

    for (let oldFenceImport of oldFence.imports || []) {
        if (!(newFence.imports || []).some(i => i == oldFenceImport)) {
            isDirty = true;
            diff.removedImports.push(oldFenceImport);
        }
    }
    for (let newFenceImport of newFence.imports || []) {
        if (!(oldFence.imports || []).some(i => i == newFenceImport)) {
            isDirty = true;
            diff.addedImports.push(newFenceImport);
        }
    }

    for (let oldFenceDependency of oldFence.dependencies || []) {
        if (!(newFence.dependencies || []).some(i => isSameDependencyRule(i, oldFenceDependency))) {
            isDirty = true;
            diff.removedDependencies.push(oldFenceDependency);
        }
    }
    for (let newFenceDependency of newFence.dependencies || []) {
        if (!(oldFence.dependencies || []).some(i => isSameDependencyRule(i, newFenceDependency))) {
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
            if (!ts.isStringLiteral(c.moduleSpecifier)) {
                throw new Error('encountered dynamic import? ' + c.moduleSpecifier.getFullText());
            }
            importSet.add(c.moduleSpecifier.text);
        }
    });

    return importSet;
}

export async function getFenceAndImportDiffsFromGit(
    compareOidOrRefName: string
): Promise<FenceAndImportDiffs | null> {
    const repo = await Git.Repository.open(process.cwd());
    const [index, headCommitTree, compareTree] = await Promise.all([
        repo.index(),
        repo.getHeadCommit().then(headCommit => headCommit.getTree()),
        resolveToCommit(repo, compareOidOrRefName).then(commit => commit.getTree()),
    ]);

    let repoDiff: Git.Diff;
    const indexToHead = await Git.Diff.treeToIndex(repo, headCommitTree, index);
    const indexIsEmpty = indexToHead.patches.length === 0;

    if (!indexIsEmpty) {
        repoDiff = await Git.Diff.treeToIndex(repo, compareTree, index, {
            contextLines: 0,
            pathspec: ['*.json', '*.ts', '*.tsx', '*.js', '*.jsx'],
        });
    } else {
        repoDiff = await Git.Diff.treeToTree(repo, compareTree, headCommitTree, {
            contextLines: 0,
            pathspec: ['*.json', '*.ts', '*.tsx', '*.js', '*.jsx'],
        });
    }
    const [fencePatches, sourcePatches] = await getFenceAndSourcePatches(repoDiff);

    // TODO: track files across moves (Should just be a fence removal and addition)
    for (let patch of [...fencePatches, ...sourcePatches]) {
        if (patch.oldFile().path() && patch.oldFile().path() !== patch.newFile().path()) {
            reportWarning(
                'Detected a moved fence or source file -- aborting partial check from git'
            );
            return null;
        }
    }

    const fenceAndImportDiffs: FenceAndImportDiffs = {
        fenceDiffs: new Map(),
        sourceImportDiffs: new Map(),
    };

    const loadFencePatchesPromise = Promise.all(
        fencePatches.map(async fencePatch => {
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
                      return getTsImportSet(newPath, newSourceBlob.content().toString('utf-8'));
                  })()
                : new Set();
            const oldSourceImportsPromise: Promise<Set<string>> | Set<string> = oldPath
                ? (async () => {
                      const oldSourceEntry = await compareTree.getEntry(oldPath);
                      const oldSourceBlob = await oldSourceEntry.getBlob();
                      return getTsImportSet(oldPath, oldSourceBlob.content().toString('utf-8'));
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
