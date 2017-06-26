// @flow

/**
 * You are supposed to have your .env file correctly configured,
 * so we can sync a test-hiera repository in here for integration
 * testing.
 */

require("dotenv-extended").load();

const { validateApiEnv } = require("../../validate");

const {
  ensureRepository,
  // createSignature
  createCredentialsCb,
} = require('../../util/git');

const {
  GIT_USERNAME,
  GIT_PASSWORD,
  GIT_REPOSITORY,
  GIT_BRANCH_PULL,
  // GIT_BRANCH_PUSH,
  // GIT_PUSH_ENABLE,
  // GIT_SYNC_INTERVAL,
  GIT_REPO_DIR,
} = validateApiEnv(process.cwd(), process.env);

const credCb = createCredentialsCb(GIT_USERNAME, GIT_PASSWORD);

// Cache
let repo;

const getSetupRepo = async (): Promise<*> => {
  if (repo == null) {
    repo = await ensureRepository(
      GIT_REPOSITORY,
      GIT_BRANCH_PULL,
      GIT_REPO_DIR,
      credCb
    );
  }
  return repo;
};

module.exports = { getSetupRepo };
