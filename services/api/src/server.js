// @flow

const http = require('http');
const util = require('util');
const logger = require('./logger');
const createApp = require('./app');

const normalizePort = value => {
  const port = parseInt(value, 10);

  if (!isNaN(port) && port > 0) {
    return port;
  }

  return false;
};

const createServer = async args => {
  logger.debug('Starting to boot the server.');

  const port = normalizePort(process.env.PORT || '3000');
  const server = http.createServer(createApp(args));

  // $FlowIgnore https://github.com/facebook/flow/pull/4176
  const listen = util.promisify(server.listen).bind(server);
  await listen(port);

  logger.debug(
    `Finished booting the server. The server is reachable at Port ${port.toString()}.`,
  );

  // eslint-disable-line
  return server;
};

module.exports = createServer;
