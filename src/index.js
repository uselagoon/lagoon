// @flow

import 'babel-polyfill';
import path from 'path';
import {
  ensureRepository,
  createCredentialsCb,
  createSignature,
} from './util/git';
import logger from './logger';
import server from './server';
import createStore from './createStore';
import createStorage from './createStorage';

const { validateApiEnv } = require('./validate');

(async () => {
  logger.debug('Starting to boot the application.');

  if (!process.env.GIT_REPOSITORY || !process.env.GIT_BRANCH_PULL) {
    throw new Error(
      'Missing repository or branch name in environment variables.'
    );
  }

  try {
    const {
      GIT_USERNAME,
      GIT_PASSWORD,
      GIT_REPOSITORY,
      GIT_BRANCH_PULL,
      GIT_BRANCH_PUSH,
      GIT_PUSH_ENABLE,
      GIT_SYNC_INTERVAL,
      GIT_REPO_DIR,
    } = validateApiEnv(process.cwd(), process.env);

    const credCb = createCredentialsCb(GIT_USERNAME, GIT_PASSWORD);
    const repository = await ensureRepository(
      GIT_REPOSITORY,
      GIT_BRANCH_PULL,
      GIT_REPO_DIR,
      credCb
    );
    const storage = createStorage(repository);

    const signature = createSignature();
    const syncInterval = GIT_SYNC_INTERVAL;
    const pushEnabled = GIT_PUSH_ENABLE;

    const sagaArgs = {
      repository,
      pullBranch: GIT_BRANCH_PULL,
      pushBranch: GIT_BRANCH_PUSH,
      signature,
      credCb,
      syncInterval,
      logger,
      pushEnabled,
    };

    // TODO: Parse the repo and get the initial state thing
    const initialState = await ({});
    const store = createStore(initialState, sagaArgs);

    await server(store, storage);

    logger.debug('Finished booting the application.');
  }
  catch (e) {
    logger.error('Error occurred while starting the application');
    logger.error(e.message);
  }
})();

