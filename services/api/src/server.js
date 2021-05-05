const http = require('http');
const util = require('util');
const logger = require('./logger');
const { toNumber } = require('./util/func');
const { getConfigFromEnv } = require('./util/config');
const app = require('./app');
const apolloServer = require('./apolloServer');

const createServer = async () => {
  logger.debug('Starting to boot the server.');

  const port = toNumber(getConfigFromEnv('PORT', '3000'));
  const server = http.createServer(app);
  server.setTimeout(900000) // higher Server timeout: 15min instead of default 2min

  apolloServer.installSubscriptionHandlers(server);

  const listen = util.promisify(server.listen).bind(server);
  await listen(port);

  logger.debug(
    `Finished booting the server. The server is reachable at port ${port.toString()}.`,
  );

  return server;
};

module.exports = createServer;
