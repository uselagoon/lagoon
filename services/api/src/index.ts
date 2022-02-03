import 'newrelic';
import { Server } from 'http';
import { promisify } from 'util';
import { initSendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { initSendToLagoonTasks } from '@lagoon/commons/dist/tasks';
import { waitForKeycloak } from './util/waitForKeycloak';
import { envHasConfig } from './util/config';
import { logger } from './loggers/logger';
import { createServer } from './server';

initSendToLagoonLogs();
initSendToLagoonTasks();

const makeGracefulShutdown = (server: Server) => {
  return async (signal: NodeJS.Signals) => {
    logger.debug(`${signal}: API Shutting Down`);

    logger.debug('Closing sqlClientPool');
    const { sqlClientPool } = await import('./clients/sqlClient');
    await sqlClientPool.end();

    process.kill(process.pid, signal);
  };
};

(async () => {
  await waitForKeycloak();

  logger.debug('Starting to boot the application.');

  try {
    if (!envHasConfig('JWTSECRET')) {
      throw new Error(
        'Required environment variable JWTSECRET is undefined or null!'
      );
    }

    if (!envHasConfig('JWTAUDIENCE')) {
      throw new Error(
        'Required environment variable JWTAUDIENCE is undefined or null!'
      );
    }

    const server = await createServer();
    const gracefulShutdown = makeGracefulShutdown(server);

    // Shutdown on tsc-watch restart, docker-compose restart/kill, and k8s pod kills
    process.once('SIGTERM', gracefulShutdown);
    // Shutdown on ctrl-c
    process.once('SIGINT', gracefulShutdown);

    logger.debug('Finished booting the application.');
  } catch (e) {
    logger.error('Error occurred while starting the application');
    logger.error(e.stack);
  }
})();
