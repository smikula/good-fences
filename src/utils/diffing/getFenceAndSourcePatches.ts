import * as Git from 'nodegit';

/**
 * Given a nodegit Diff object, partitions it by path
 * into diffs between fences or script files. Ignores any paths
 * that are neither fences nor script files
 */
export async function getFenceAndSourcePatches(diffSinceHash: Git.Diff, extensions: string[]) {
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
