// @flow

/* ::
import type { $Request, $Response, NextFunction } from 'express';

class Request extends express$Request {
  credentials: any
  authToken: string
};
*/

const R = require('ramda');
const logger = require('./logger');
const { getSqlClient } = require('./clients/sqlClient');
const {
  getCredentialsForKeycloakToken,
  getCredentialsForLegacyToken,
} = require('./util/auth');

const parseBearerToken = R.compose(
  R.ifElse(
    splits =>
      R.length(splits) === 2 &&
      R.compose(
        R.toLower,
        R.defaultTo(''),
        R.head,
      )(splits) === 'bearer',
    R.nth(1),
    R.always(null),
  ),
  R.split(' '),
  R.defaultTo(''),
);

const prepareToken = async (
  req /* : Request */,
  res /* : $Response */,
  next /* : NextFunction */,
) => {
  // Allow access to status without auth.
  if (req.url === '/status') {
    next();
    return;
  }

  const token = parseBearerToken(req.get('Authorization'));

  if (token == null) {
    logger.debug('No Bearer Token');
    res
      .status(401)
      .send({ errors: [{ message: 'Unauthorized - Bearer Token Required' }] });
    return;
  }

  req.authToken = token;

  next();
};

const keycloak = async (
  req /* : Request */,
  res /* : $Response */,
  next /* : NextFunction */,
) => {
  // Allow access to status without auth.
  if (req.url === '/status') {
    next();
    return;
  }

  const sqlClient = getSqlClient();

  try {
    const credentials = await getCredentialsForKeycloakToken(
      sqlClient,
      req.authToken,
    );

    req.credentials = credentials;
  } catch (e) {
    // It might be a legacy token, so continue on.
    logger.debug(`Keycloak token auth failed: ${e.message}`);
  }

  sqlClient.end();

  next();
};

const legacy = async (
  req /* : Request */,
  res /* : $Response */,
  next /* : NextFunction */,
) => {
  // Allow access to status without auth.
  if (req.url === '/status') {
    next();
    return;
  }

  // Allow keycloak authenticated sessions
  if (req.credentials) {
    next();
    return;
  }

  const sqlClient = getSqlClient();

  try {
    const credentials = await getCredentialsForLegacyToken(
      sqlClient,
      req.authToken,
    );

    req.credentials = credentials;
    sqlClient.end();

    next();
  } catch (e) {
    sqlClient.end();
    res.status(403).send({
      errors: [{ message: `Forbidden - Invalid Auth Token: ${e.message}` }],
    });
  }
};

const authMiddleware = [
  prepareToken,
  // First attempt to validate token with keycloak.
  keycloak,
  // Then validate legacy token.
  legacy,
];

module.exports = authMiddleware;
