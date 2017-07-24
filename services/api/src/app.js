// @flow

import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import { json } from 'body-parser';
import selectors from './selectors';
import logger from './logger';
import createRouter from './routes';

import type { $Application, $Request } from 'express';
import type { ApiStore } from './createStore';

export type Context = {
  selectors: typeof selectors,
  store: ApiStore,
};

export const getContext = (req: $Request): Context =>
  (req.app.get('context'): any);

export default (store: ApiStore): $Application => {
  const app = express();

  // Set the global app context (make the state accessible
  // to the routes and graphql).
  app.set('context', {
    selectors,
    store,
  });

  // Use compression (gzip) for responses.
  app.use(compression());

  // Automatically decode json.
  app.use(json());

  // Add custom configured logger (morgan through winston).
  app.use(
    morgan('combined', {
      stream: {
        write: message => logger.info(message),
      },
    }),
  );

  // Add routes.
  app.use('/', createRouter());

  return app;
};
