// @flow

import http from 'http';
import { debug } from './logger';
import { defer } from './util/promise';
import app from './app';

import type { ApiStore } from './createStore';
import type { Storage } from './createStorage';

const normalizePort = (value) => {
  const port = parseInt(value, 10);

  if (!isNaN(port) && port > 0) {
    return port;
  }

  return false;
};

export default async (store: ApiStore, storage: Storage): Promise<Server> => {
  debug('Starting to boot the server.');

  const port = normalizePort(process.env.PORT || '80');
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

  debug(`Finished booting the server. The server is reachable at Port ${port.toString()}.`); // eslint-disable-line

  return server;
};
