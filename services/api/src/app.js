// @flow

const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const { json } = require('body-parser');
const logger = require('./logger');
const createRouter = require('./routes');
const { createAuthMiddleware } = require('./auth');

const Dao = require('./dao');

/* ::
import type MariaSQL from 'mariasql';

type CreateAppArgs = {
  store?: Object,
  jwtSecret: string,
  jwtAudience: string,
  sqlClient: MariaSQL,
};
*/

const createApp = (args /* : CreateAppArgs */) => {
  const {
    // store,
    jwtSecret,
    jwtAudience,
    sqlClient,
  } = args;
  const app = express();

  const dao = Dao.make(sqlClient);

  app.set('context', {
    sqlClient,
    dao,
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

  app.use(
    createAuthMiddleware({
      baseUri: 'http://auth-server:3000',
      jwtSecret,
      jwtAudience,
    }),
  );

  // Add routes.
  app.use('/', createRouter());

  return app;
};

module.exports = createApp;
