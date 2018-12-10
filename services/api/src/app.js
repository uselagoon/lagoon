// @flow

const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const cors = require('cors');
const { json } = require('body-parser');
const logger = require('./logger');
const createRouter = require('./routes');
const { authKeycloakMiddleware } = require('./authKeycloakMiddleware');
const { createAuthMiddleware } = require('./authMiddleware');
const apolloServer = require('./apolloServer');

/* ::
type CreateAppArgs = {
  store?: Object,
  jwtSecret: string,
  jwtAudience: string,
};
*/

const createApp = (args /* : CreateAppArgs */) => {
  const {
    // store,
    jwtSecret,
    jwtAudience,
  } = args;
  const app = express();

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

  // TODO: Restrict requests to lagoon domains?
  app.use(cors());

  // $FlowFixMe
  app.use(authKeycloakMiddleware());

  app.use(
    createAuthMiddleware({
      baseUri: 'http://auth-server:3000',
      jwtSecret,
      jwtAudience,
    }),
  );

  // Add routes.
  app.use('/', createRouter());

  apolloServer.applyMiddleware({ app });

  return app;
};

module.exports = createApp;
