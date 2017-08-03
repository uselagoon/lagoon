// @flow

const Git = require('nodegit');

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

const createSignature = (
  time?: number = parseInt(Date.now() / 1000, 10),
  offset?: number = new Date().getTimezoneOffset()
): Signature => Git.Signature.create('API', 'api@amazee.io', time, offset);

const createCredentialsCb = (
  username: string,
  password: string
): CredCb => () => Git.Cred.userpassPlaintextNew(username, password);

const expectDefaultState = (repository: Repository): Repository => {
  if (!repository.isDefaultState()) {
    throw new Error('The repository is not in the default state.');
  }

  return repository;
};

const getRepository = async (
  url: string,
  branch: string,
  destination: string,
  credCb: CredCb
): Promise<Repository> => {
  try {
    // Get the repository if it already exists.
    return await Git.Repository.open(destination);
  } catch (e) {
    // Repository doesn't exist locally yet. Clone it.
    return Git.Clone.clone(url, destination, {
      checkoutBranch: branch,
      fetchOpts: {
        callbacks: { certificateCheck: () => 1, credentials: credCb },
      },
    });
  }
};

const getRemote = (repository: Repository, remote: string): Promise<Remote> =>
  repository.getRemote(remote);

const remotePush = (
  remote: Remote,
  refs: Array<string>,
  credCb: CredCb
): Promise<void> =>
  remote.push(refs, {
    // Attempt to push any pending commits.
    callbacks: { certificateCheck: () => 1, credentials: credCb },
  });

const revparseSingle = (
  repository: Repository,
  spec: string
): Promise<Revparse> => Git.Revparse.single(repository, spec);

const fetchAll = (
  repository: Repository,
  credentialsCb: CredCb
): Promise<void> =>
  repository.fetchAll({
    // Fetch any changes from the remote.
    callbacks: { certificateCheck: () => 1, credentials: credentialsCb },
  });

// Open the repository directory or fetch it from the remote.
const ensureRepository = async (
  url: string,
  branch: string,
  destination: string,
  credCb: CredCb
): Promise<Repository> => {
  const repository = await getRepository(url, branch, destination, credCb);

  // Ensure that we are on the right branch.
  await repository.checkoutBranch(branch);

  return expectDefaultState(repository);
};

const rebase = (
  repository: Repository,
  branch: string,
  upstream: string,
  onto: string,
  sig: Signature
): Promise<void> => repository.rebaseBranches(branch, upstream, onto, sig);

module.exports = {
  createSignature,
  createCredentialsCb,
  expectDefaultState,
  getRepository,
  getRemote,
  remotePush,
  revparseSingle,
  fetchAll,
  ensureRepository,
  rebase,
};
