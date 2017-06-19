// @flow

import Git from 'nodegit';

import type {
  Repository,
  Signature,
  Revparse,
  Remote,
  CredAcquireCb as CredCb,
} from 'nodegit';

export type {
  Repository,
  CredAcquireCb as CredCb,
  Remote,
  Signature,
} from 'nodegit';

export function createSignature(
  time?: number = parseInt(Date.now() / 1000, 10),
  offset?: number = new Date().getTimezoneOffset()
): Signature {
  return Git.Signature.create('API', 'api@amazee.io', time, offset);
}

export function createCredentialsCb(
  username: string,
  password: string
): CredCb {
  return () => {
    return Git.Cred.userpassPlaintextNew(username, password);
  };
}

function expectDefaultState(repository: Repository): Repository {
  if (!repository.isDefaultState()) {
    throw new Error('The repository is not in the default state.');
  }

  return repository;
}

export async function getRepository(
  url: string,
  branch: string,
  destination: string,
  credCb: CredCb
): Promise<Repository> {
  try {
    // Get the repository if it already exists.
    return await Git.Repository.open(destination);
  }
  catch (e) {
    // Repository doesn't exist locally yet. Clone it.
    return await Git.Clone.clone(url, destination, {
      checkoutBranch: branch,
      fetchOpts: {
        callbacks: { certificateCheck: () => 1, credentials: credCb },
      },
    });
  }
}

export async function getRemote(
  repository: Repository,
  remote: string
): Promise<Remote> {
  return await repository.getRemote(remote);
}

export async function remotePush(
  remote: Remote,
  refs: Array<string>,
  credCb: CredCb
): Promise<void> {
  // Attempt to push any pending commits.
  await remote.push(refs, {
    callbacks: { certificateCheck: () => 1, credentials: credCb },
  });
}

export async function revparseSingle(
  repository: Repository,
  spec: string
): Promise<Revparse> {
  return await Git.Revparse.single(repository, spec);
}

export async function fetchAll(
  repository: Repository,
  credentialsCb: CredCb
): Promise<void> {
  // Fetch any changes from the remote.
  await repository.fetchAll({
    callbacks: { certificateCheck: () => 1, credentials: credentialsCb },
  });
}

// Open the repository directory or fetch it from the remote.
export async function ensureRepository(
  url: string,
  branch: string,
  destination: string,
  credCb: CredCb
): Promise<Repository> {
  const repository = await getRepository(url, branch, destination, credCb);

  // Ensure that we are on the right branch.
  await repository.checkoutBranch(branch);

  return expectDefaultState(repository);
}

export async function rebase(
  repository: Repository,
  branch: string,
  upstream: string,
  onto: string,
  sig: Signature
): Promise<void> {
  await repository.rebaseBranches(branch, upstream, onto, sig);
}

