// @flow

import http from 'http';
import logger from './logger';
import { defer } from './util/promise';
import app from './app';

import type { ApiStore } from './createStore';

const normalizePort = (value) => {
  const port = parseInt(value, 10);

  if (!isNaN(port) && port > 0) {
    return port;
  }

  return false;
};

export default async (store: ApiStore): Promise<Server> => {
  logger.debug('Starting to boot the server.');

  const port = normalizePort(process.env.PORT || '8080');
  const server = http.createServer(app(store));

  const deferred = defer();

  server.listen(port, (err) => {
    if (err) {
      deferred.reject(err);
      return;
    }
    deferred.resolve();
  });

  await deferred.promise;

  logger.debug(
    `Finished booting the server. The server is reachable at Port ${port.toString()}.`,
  );

  // eslint-disable-line
  return server;
};
