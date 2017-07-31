// @flow

const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const { json } = require('body-parser');
const selectors = require('./selectors');
const logger = require('./logger');
const createRouter = require('./routes');

import type { $Application } from 'express';
import type { ApiStore } from './createStore';

const createApp = (store: ApiStore): $Application => {
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

  // Add routes.
  app.use('/', createRouter());

  return app;
};

module.exports = createApp;
