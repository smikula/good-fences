import * as Git from 'nodegit';

export async function resolveHashOrRefToCommit(
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
