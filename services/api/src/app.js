// @flow

const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const cors = require('cors');
const { json } = require('body-parser');
const logger = require('./logger');
const createRouter = require('./routes');
const { createAuthMiddleware } = require('./authMiddleware');

const Dao = require('./dao');

/* ::
import type MariaSQL from 'mariasql';
import type elasticsearch from 'elasticsearch';

type CreateAppArgs = {
  store?: Object,
  jwtSecret: string,
  jwtAudience: string,
  sqlClient: MariaSQL,
  esClient: elasticsearch.Client,
  keycloakClient: Object,
  searchguardClient: Object,
  kibanaClient: Object
};
*/

const createApp = (args /* : CreateAppArgs */) => {
  const {
    // store,
    jwtSecret,
    jwtAudience,
    sqlClient,
    esClient,
    keycloakClient,
    searchguardClient,
    kibanaClient
  } = args;
  const app = express();

  const dao = Dao.make(sqlClient, esClient, keycloakClient, searchguardClient, kibanaClient);

  app.set('context', {
    sqlClient,
    esClient,
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

  // TODO: Restrict requests to lagoon domains?
  app.use(cors());

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
