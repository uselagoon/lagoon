// @flow

import type { IOEffect } from 'redux-saga/effects';
import type { Repository, CredCb, Remote, Signature } from '../util/git';
import type { Logger } from '../logger';

const { delay } = require('redux-saga');
const { call, put } = require('redux-saga/effects');

const {
  fetchAll,
  revparseSingle,
  getRemote,
  remotePush,
  rebase,
} = require('../util/git');

const { readSiteGroupsFile } = require('../storage/sitegroup');
const { listYamlFiles } = require('../storage');
const { readClientsFile } = require('../storage/client');
const { getSiteFiles } = require('../storage/sitefiles');
const {
  setSiteGroupsFile,
  setSiteFiles,
  setClientsFile,
} = require('../actions');

export type SyncSagaArgs = {
  syncInterval: number,
  pushEnabled?: boolean,
  repository: Repository,
  pullBranch: string,
  pushBranch: string,
  credCb: CredCb,
  signature: Signature,
  logger: Logger,
};

export type RebaseSagaArgs = {
  repository: Repository,
  branch: string,
  credCb: CredCb,
  signature: Signature,
  logger: Logger,
};

function* rebaseSaga({
  repository,
  branch,
  signature,
  credCb,
}: RebaseSagaArgs): Generator<IOEffect, *, *> {
  yield call(fetchAll, repository, credCb);
  yield call(rebase, repository, branch, `origin/${branch}`, branch, signature);
}

function* pushSaga({
  repository,
  pullBranch,
  pushBranch,
  credCb,
  logger: { debug, error },
}: SyncSagaArgs): Generator<IOEffect, *, *> {
  yield call(fetchAll, repository, credCb);

  const localRevision = yield call(revparseSingle, repository, pullBranch);
  const originRevision = yield call(
    revparseSingle,
    repository,
    `origin/${pushBranch}`
  );

  // Check if the current local and remote revision are identical.
  if (localRevision.id().toString() === originRevision.id().toString()) {
    yield call(debug, 'Local and remote revision are identicial.');
    return;
  }

  const refs = [`refs/heads/${pullBranch}:refs/heads/${pushBranch}`];
  const remote: Remote = yield call(getRemote, repository, 'origin');

  try {
    // Attempt to push any pending commits.
    yield call(remotePush, remote, refs, credCb);
  } catch (e) {
    yield call(error, e.stack);
  }
}

function* syncSaga(args: SyncSagaArgs): Generator<IOEffect, *, *> {
  const {
    repository,
    pullBranch,
    syncInterval,
    pushEnabled = false,
    logger: { debug, error, info },
  } = args;

  // Read sitegroups and store them in the state
  const repoDir = repository.workdir();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      yield call(info, 'Rebasing repository');
      yield call(rebaseSaga, Object.assign({}, args, { branch: pullBranch }));

      if (pushEnabled) {
        yield call(pushSaga, args);
      }

      yield call(debug, 'Finished synchronization');

      const siteGroupsFile = yield call(readSiteGroupsFile, repoDir);
      yield put(setSiteGroupsFile(siteGroupsFile));

      const siteFilePaths = yield call(listYamlFiles, repoDir);
      const siteFiles = yield call(getSiteFiles, siteFilePaths);
      yield put(setSiteFiles(siteFiles));

      const clientsFile = yield call(readClientsFile, repoDir);
      yield put(setClientsFile(clientsFile));

      // Wait some time before re-doing the sync again
      yield call(delay, syncInterval);
    } catch (e) {
      yield call(error, e.stack);
    }
  }
}

module.exports = {
  rebaseSaga,
  pushSaga,
  syncSaga,
};
