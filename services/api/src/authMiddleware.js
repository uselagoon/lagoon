// @flow

const jwt = require('jsonwebtoken');
const R = require('ramda');
const logger = require('./logger');
const { getPermissionsForUser } = require('./util/auth');

/* ::
import type { $Application } from 'express';
import type { CredMaybe } from './resources';
*/

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

const decodeToken = (
  token,
  secret,
) /* : ?{aud: string, role: string, userId: number} */ => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (e) {
    return null;
  }
};

/* ::
import type { $Request, $Response, NextFunction } from 'express';

type CreateAuthMiddlewareArgs = {
  baseUri: string,
  jwtSecret: string,
  jwtAudience: string,
};

class Request extends express$Request {
  credentials: any
};

type CreateAuthMiddlewareFn =
  CreateAuthMiddlewareArgs =>
    (
      // To allow extending the request object with Flow
      Request,
      $Response,
      NextFunction
    ) =>
      Promise<void>

*/

const createAuthMiddleware /* : CreateAuthMiddlewareFn */ = ({
  jwtSecret,
  jwtAudience,
}) => async (req, res, next) => {
  // Allow access to status without auth
  if (req.url === '/status') {
    next();
    return;
  }

  // Allow keycloak authenticated sessions
  if (req.credentials) {
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

  let decoded = '';
  try {
    decoded = decodeToken(token, jwtSecret);
  } catch (e) {
    const errorMessage = `Error while decoding auth token: ${e.message}`;
    logger.debug(errorMessage);
    res.status(500).send({
      errors: [
        {
          message: errorMessage,
        },
      ],
    });
    return;
  }

  try {
    if (decoded == null) {
      throw new Error('Decoding token resulted in "null" or "undefined"');
    }

    const { userId, role = 'none', aud } = decoded;

    if (jwtAudience && aud !== jwtAudience) {
      logger.info(`Invalid token with aud attribute: "${aud || ''}"`);
      res.status(500).send({
        errors: [{ message: 'Auth token audience mismatch' }],
      });
      return;
    }

    // We need this, since non-admin credentials are required to have an user id
    let nonAdminCreds = {};

    if (role !== 'admin') {
      const permissions = await getPermissionsForUser(userId);

      if (R.isEmpty(permissions)) {
        res.status(401).send({
          errors: [
            {
              message: `Unauthorized - No permissions for user id ${userId}`,
            },
          ],
        });
        return;
      }

      nonAdminCreds = {
        userId,
        // Read and write permissions
        permissions,
      };
    }

    const credentials /* : CredMaybe */ = {
      role,
      permissions: {},
      ...nonAdminCreds,
    };

    req.credentials = credentials;

    next();
  } catch (e) {
    res.status(403).send({
      errors: [{ message: `Forbidden - Invalid Auth Token: ${e.message}` }],
    });
  }
};

module.exports = {
  createAuthMiddleware,
};
