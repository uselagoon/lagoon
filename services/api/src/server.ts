import http from 'http';
import util from 'util';
import { logger } from './loggers/logger';
import { toNumber } from './util/func';
import { getConfigFromEnv } from './util/config';
import { app } from './app';
import apolloServer from './apolloServer';

export const createServer = async () => {
  logger.debug('Starting to boot the server.');

  const port = toNumber(getConfigFromEnv('PORT', '3000'));
  const server = http.createServer(app);
  server.setTimeout(900000); // higher Server timeout: 15min instead of default 2min

  apolloServer.installSubscriptionHandlers(server);

  const listen = util.promisify(server.listen).bind(server);
  await listen(port);

  logger.debug(
    `Finished booting the server. The server is reachable at port ${port.toString()}.`
  );

  return server;
};
