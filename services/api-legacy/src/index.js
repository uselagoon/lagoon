import 'babel-polyfill';
import ensureRepository from './utility/ensureRepository';
import server from './server';
import sync from './sync';

(async () => {
  try {
    debug('Starting to boot the application.');

    // Wait for the repository to be initialized.
    global.repository = await ensureRepository(process.env.GIT_REPOSITORY, process.env.GIT_BRANCH_PULL, '.repository');

    await sync(repository);
    await server(repository);

    debug('Finished booting the application.');
  } catch (error) {
    // Failed loading the repository or initialization.
    debug(error);
  }
})();
