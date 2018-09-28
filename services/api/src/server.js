// @flow

const http = require('http');
const util = require('util');
const logger = require('./logger');
const createApp = require('./app');

const normalizePort = (value) => {
  const port = parseInt(value, 10);

  if (!isNaN(port) && port > 0) {
    return port;
  }

  return false;
};

/* ::
import type MariaSQL from 'mariasql';
import type elasticsearch from 'elasticsearch';

type CreateServerArgs = {
  store?: Object,
  jwtSecret: string,
  jwtAudience: string,
  sqlClient: MariaSQL,
  esClient: elasticsearch.Client,
  keycloakClient: Object
};
*/

const createServer = async (args /* : CreateServerArgs */) => {
  logger.debug('Starting to boot the server.');

  const port = normalizePort(process.env.PORT || '3000');
  const server = http.createServer(createApp(args));

  const listen = util.promisify(server.listen).bind(server);
  await listen(port);

  logger.debug(
    `Finished booting the server. The server is reachable at port ${port.toString()}.`,
  );

  return server;
};

module.exports = createServer;
