
import { Revparse } from 'nodegit';
import enqueue from './queue';
import createSignature from './utility/createSignature';
import credentialsCallback from './utility/credentialsCallback';

const fetch = async (repository) => {
  // Fetch any changes from the remote.
  await repository.fetchAll({
    callbacks: {
      certificateCheck: () => 1,
      credentials: credentialsCallback,
    },
  });
};


const rebase = async (repository) => {
  await fetch(repository);

  // Attempt to rebase.
  const signature = createSignature();
  const branch = process.env.GIT_BRANCH_PULL;

  await repository.rebaseBranches(branch, `origin/${branch}`, branch, signature);
};

const push = async (repository) => {
  await fetch(repository);

  const pullBranch = process.env.GIT_BRANCH_PULL;
  const pushBranch = process.env.GIT_BRANCH_PUSH;

  const localRevision = await Revparse.single(repository, pullBranch);
  const originRevision = await Revparse.single(repository, `origin/${pushBranch}`);

  // Check if the current local and remote revision are identical.
  if (localRevision.id().toString() === originRevision.id().toString()) {
    debug('Local and remote revision are identicial.');

    return;
  }

  const refs = [`refs/heads/${pullBranch}:refs/heads/${pushBranch}`];
  const remote = await repository.getRemote('origin');

  // Attempt to push any pending commits.
  await remote.push(refs, {
    callbacks: {
      certificateCheck: () => 1,
      credentials: credentialsCallback,
    },
  });
};

const synchronize = async (repository) => {
  debug('Starting synchronization with remote.');

  // Log the start time to measure the performance.
  const start = Date.now();

  try {
    // Rebase the 'master' branch and then push to the remote.
    await rebase(repository);

    if (process.env.GIT_PUSH_ENABLE.toLowerCase() === 'true') {
      await push(repository);
    }

    // Fetch the tip of the branch (last commit).
    const commit = (await repository.getHeadCommit()).toString();

    const end = Date.now();
    const performance = (end - start) / 1000;
    debug(`Finished synchronization in ${performance} seconds.`);
    debug(`Currently on revision ${commit}.`);

    // Wait for a configured duration until queuing another synchronization.
    setTimeout(() => enqueue(synchronize, repository), process.env.SYNC_INTERVAL);
  } catch (error) {
    // TODO Lock the API if synchronization failed and is not recoverable.
    debug('Encountered an error during synchronization.');

    throw error;
  }
};

export default async (repository) => {
  if (process.env.NODE_ENV === 'development') {
    // Don't synchronize immediately during production.
    setTimeout(() => enqueue(synchronize, repository), process.env.SYNC_INTERVAL);
  } else {
    // Wait for the synchronization to finish.
    await enqueue(synchronize, repository);
  }
};
