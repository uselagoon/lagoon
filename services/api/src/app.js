// @flow

const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const { json } = require('body-parser');
const selectors = require('./selectors');
const logger = require('./logger');
const createRouter = require('./routes');
const { createAuthMiddleware } = require('./auth');

import type { $Application } from 'express';
import type { ApiStore } from './createStore';

export type CreateAppArgs = {
  store: ApiStore,
  jwtSecret: string,
  jwtAudience?: string,
};

const createApp = (args: CreateAppArgs): $Application => {
  const { store, jwtSecret, jwtAudience } = args;
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
    })
  );

  app.use(
    createAuthMiddleware({
      baseUri: 'http://auth-server:3000',
      jwtSecret,
      jwtAudience,
    })
  );

  // Add routes.
  app.use('/', createRouter());

  return app;
};

module.exports = createApp;
