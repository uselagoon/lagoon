// @flow

import { delay } from 'redux-saga';
import { call, put } from 'redux-saga/effects';

import type { IOEffect } from 'redux-saga/effects';
import type { Repository, CredCb, Remote, Signature } from '../util/git';

import { fetchAll, revparseSingle, getRemote, remotePush, rebase } from '../util/git';

import type { Logger } from '../logger';

import { readSiteGroupsFile, parseSiteGroupsFile } from '../storage/sitegroup';
import { getAllFilesWithContent } from '../storage/site';
import { setSiteGroups, setSiteFiles } from '../actions';

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

export function* rebaseSaga(args: RebaseSagaArgs): Generator<IOEffect, *, *> {
  const { repository, branch, signature, credCb } = args;

  yield call(fetchAll, repository, credCb);
  yield call(rebase, repository, branch, `origin/${branch}`, branch, signature);
}

export function* pushSaga(args: SyncSagaArgs): Generator<IOEffect, *, *> {
  const { repository, pullBranch, pushBranch, credCb, logger } = args;

  const { debug, error } = logger;

  yield call(fetchAll, repository, credCb);

  const localRevision = yield call(revparseSingle, repository, pullBranch);
  const originRevision = yield call(revparseSingle, repository, `origin/${pushBranch}`);

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
    yield call(error, e.message);
  }
}

export function* syncSaga(args: SyncSagaArgs): Generator<IOEffect, *, *> {
  const { repository, pullBranch, syncInterval, pushEnabled = false, logger } = args;

  // Read sitegroups and store them in the state
  const repoDir = repository.workdir();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    yield call(logger.info, 'Rebasing repository');
    yield call(rebaseSaga, { ...args, branch: pullBranch });

    if (pushEnabled) {
      yield call(pushSaga, args);
    }

    yield call(logger.debug, 'Finished synchronization');

    const siteGroupsYaml = yield call(readSiteGroupsFile, repoDir);
    const siteGroups = yield call(parseSiteGroupsFile, siteGroupsYaml);

    yield put(setSiteGroups(siteGroups));

    const siteFiles = yield call(getAllFilesWithContent, repoDir);
    yield put(setSiteFiles(siteFiles));

    // Wait some time before re-doing the sync again
    yield call(delay, syncInterval);
  }
}
