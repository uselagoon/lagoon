// @flow

const {
  ensureRepository,
  createCredentialsCb,
  createSignature,
} = require('./util/git');

const logger = require('./logger');
const createServer = require('./server');
const createStore = require('./createStore');

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
      JWTSECRET,
      JWTAUDIENCE,
    } = validateApiEnv(process.cwd(), process.env);

    const credCb = createCredentialsCb(GIT_USERNAME, GIT_PASSWORD);

    const repository = await ensureRepository(
      GIT_REPOSITORY,
      GIT_BRANCH_PULL,
      GIT_REPO_DIR,
      credCb
    );

    const signature = createSignature();

    const sagaArgs = {
      repository,
      pullBranch: GIT_BRANCH_PULL,
      pushBranch: GIT_BRANCH_PUSH,
      signature,
      credCb,
      syncInterval: GIT_SYNC_INTERVAL,
      logger,
      pushEnabled: GIT_PUSH_ENABLE,
    };

    // TODO: Parse the repo and get the initial state thing
    const initialState = await {};
    const store = createStore(initialState, sagaArgs);

    await createServer({
      store,
      jwtSecret: JWTSECRET,
      jwtAudience: JWTAUDIENCE,
    });

    logger.debug('Finished booting the application.');
  } catch (e) {
    logger.error('Error occurred while starting the application');
    logger.error(e.stack);
  }
})();
