// @flow

const path = require('path');

import type { ApiEnv } from './types';

const validateApiEnv = (cwd: string, env: Object): ApiEnv => {
  const {
    GIT_USERNAME = '',
    GIT_PASSWORD = '',
    GIT_REPOSITORY,
    GIT_BRANCH_PULL,
    GIT_BRANCH_PUSH,
    GIT_PUSH_ENABLE = 'false',
    GIT_SYNC_INTERVAL = 60000,
    GIT_REPO_DIR = path.join('/hiera'),
    JWTSECRET = '',
    JWTAUDIENCE,
  } = env;

  // TODO: Too tedious to validate it properly
  const ret: ApiEnv = ({
    GIT_USERNAME,
    GIT_PASSWORD,
    GIT_REPOSITORY,
    GIT_BRANCH_PULL,
    GIT_BRANCH_PUSH,
    GIT_PUSH_ENABLE: GIT_PUSH_ENABLE.toLowerCase() === 'true',
    GIT_SYNC_INTERVAL,
    GIT_REPO_DIR,
    JWTSECRET,
    JWTAUDIENCE,
  }: any);

  Object.keys(ret).forEach((k) => {
    if (ret[k] == null) {
      throw new Error(`${k} must not be null`);
    }
  });

  return ret;
};

module.exports = { validateApiEnv };
