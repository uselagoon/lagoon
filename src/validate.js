// @flow

const path = require("path");

type ApiEnv = {
  GIT_USERNAME: string,
  GIT_PASSWORD: string,
  GIT_REPOSITORY: string,
  // Upstream repository to sync
  GIT_BRANCH_PULL: string,
  // branch to pull from
  GIT_BRANCH_PUSH: string,
  // branch to push to
  GIT_PUSH_ENABLE: boolean,
  GIT_SYNC_INTERVAL: number,
  GIT_REPO_DIR: string
};

const validateApiEnv = (cwd: string, env: Object): ApiEnv => {
  const {
    GIT_USERNAME = "",
    GIT_PASSWORD = "",
    GIT_REPOSITORY,
    GIT_BRANCH_PULL,
    GIT_BRANCH_PUSH,
    GIT_PUSH_ENABLE = "false",
    GIT_SYNC_INTERVAL = 60000,
    GIT_REPO_DIR = path.join(cwd, ".repository")
  } = env;

  // TODO: Too tedious to validate it properly
  const ret: ApiEnv = ({
    GIT_USERNAME,
    GIT_PASSWORD,
    GIT_REPOSITORY,
    GIT_BRANCH_PULL,
    GIT_BRANCH_PUSH,
    GIT_PUSH_ENABLE: GIT_PUSH_ENABLE.toLowerCase() === "true",
    GIT_SYNC_INTERVAL,
    GIT_REPO_DIR,
  }: any);

  Object.keys(ret).forEach((k) => {
    if (ret[k] == null) {
      throw new Error(`${k} must not be null`);
    }
  });

  return ret;
};

module.exports = { validateApiEnv };

