import { Commit, Oid, Reference, Repository } from 'nodegit';

export async function resolveHashOrRefToCommit(
    repo: Repository,
    compareOidOrRefName: string
): Promise<Commit> {
    let oid: Oid;
    try {
        oid = Oid.fromString(compareOidOrRefName);
    } catch {
        oid = await Reference.nameToId(repo, compareOidOrRefName);
    }
    return await Commit.lookup(repo, oid);
}
