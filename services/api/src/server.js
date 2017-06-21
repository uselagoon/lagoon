import Promise from 'bluebird';
import http from 'http';
import app from './app';
import normalizePort from './utility/normalizePort';

export default async (repository) => {
  debug('Starting to boot the server.');

  // Log the start time to measure the performance.
  const start = Date.now();

  const port = normalizePort(process.env.PORT || '3000');

  const server = http.createServer(app(repository));
  const listen = Promise.promisify(server.listen, {
    context: server,
  });

  // Wait for the server to finish booting before resolving the promise.
  await listen(port);

  const end = Date.now();
  const performance = (end - start) / 1000;
  debug(`Finished booting the server in ${performance} seconds. The server is reachable at Port ${port}.`); // eslint-disable-line
};
