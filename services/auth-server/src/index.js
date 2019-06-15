// @flow

const querystring = require('querystring');
const R = require('ramda');
const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const logger = require('./logger');
const { generateRoute } = require('./routes');

import type { LagoonErrorWithStatus, $Request, $Response } from 'express';

declare type keycloakGrant = {
  access_token: string,
}

const app = express();

// Add custom configured logger (morgan through winston).
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message),
    },
  }),
);

const port = process.env.PORT || 3000;
const lagoonKeycloakRoute = R.compose(
  R.defaultTo('http://keycloak:8080'),
  R.find(R.test(/keycloak-/)),
  R.split(','),
  R.propOr('', 'LAGOON_ROUTES'),
)(process.env);

const getUserGrant = async (userId: string): Promise<keycloakGrant> => {
  try {
    const data = {
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      client_id: 'auth-server',
      client_secret: R.propOr(
        'no-client-secret-configured',
        'KEYCLOAK_AUTH_SERVER_CLIENT_SECRET',
        process.env,
      ),
      requested_subject: userId,
    };

    const response = await axios.post(
      `${lagoonKeycloakRoute}/auth/realms/lagoon/protocol/openid-connect/token`,
      querystring.stringify(data),
    );

    return response.data;
  } catch (err) {
    if (err.response) {
      const msg = R.pathOr('Unknown error', ['response', 'data', 'error_description'], err);
      throw new Error(`Could not get user grant: ${msg}`);
    }
  }
};

app.post('/generate', ...generateRoute(getUserGrant));

app.use((err: LagoonErrorWithStatus, req: $Request, res: $Response) => {
  logger.error(err.toString());
  res.status(err.status || 500);
  res.send(`Request failed: ${err.toString()}`);
});

app.listen(port, () => {
  logger.debug(`Server listening on port ${port}.`);
});
