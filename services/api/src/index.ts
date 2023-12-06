import 'newrelic';
import { Server } from 'http';
import { initSendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import {
  initSendToLagoonTasks,
  initSendToLagoonActions
} from '@lagoon/commons/dist/tasks';
import { waitForKeycloak } from './util/waitForKeycloak';
import { envHasConfig } from './util/config';
import { logger } from './loggers/logger';
import { createServer } from './server';

initSendToLagoonLogs();
initSendToLagoonTasks();
initSendToLagoonActions();

const makeGracefulShutdown = (server: Server) => {
  return async (signal: NodeJS.Signals) => {
    logger.info(`${signal}: API Shutting Down`);

    logger.verbose('Closing sqlClientPool');
    const { sqlClientPool } = await import('./clients/sqlClient');
    await sqlClientPool.end();

    process.kill(process.pid, signal);
  };
};

(async () => {
  if (!envHasConfig('JWTSECRET') || !envHasConfig('JWTAUDIENCE')) {
    logger.fatal('Environment variables `JWTSECRET`/`JWTAUDIENCE` are not set');
  } else {
    await waitForKeycloak();

    try {
      const server = await createServer();
      const gracefulShutdown = makeGracefulShutdown(server);

      // Shutdown on tsc-watch restart, docker-compose restart/kill, and k8s pod kills
      process.once('SIGTERM', gracefulShutdown);
      // Shutdown on ctrl-c
      process.once('SIGINT', gracefulShutdown);
    } catch (e) {
      logger.fatal(`Couldn't start the API: ${e.message}`);
    }
  }
})();
