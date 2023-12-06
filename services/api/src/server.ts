import http from 'http';
import util from 'util';
import { logger } from './loggers/logger';
import { toNumber } from './util/func';
import { getConfigFromEnv } from './util/config';
import { app } from './app';
import apolloServer from './apolloServer';

export const createServer = async () => {
  logger.verbose('Starting the api...');

  const port = toNumber(getConfigFromEnv('PORT', '3000'));
  const server = http.createServer(app);
  server.setTimeout(900000); // higher Server timeout: 15min instead of default 2min

  apolloServer.installSubscriptionHandlers(server);

  const listen = util.promisify(server.listen).bind(server);
  await listen(port);

  logger.info(`API is ready on port ${port.toString()}`);

  return server;
};
