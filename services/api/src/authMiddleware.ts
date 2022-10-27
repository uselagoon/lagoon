import * as R from 'ramda';
import { Request, Response, NextFunction } from 'express';
import { decode } from 'jsonwebtoken';
import {
  isLegacyToken,
  isKeycloakToken,
  getGrantForKeycloakToken,
  getCredentialsForLegacyToken
} from './util/auth';
import { userActivityLogger } from './loggers/userActivityLogger';
const { getClientIp } = require('@supercharge/request-ip');

export type RequestWithAuthData = Request & {
  legacyCredentials: any;
  authToken: string;
  kauth: any;
  ipAddress?: any;
};

const getBearerTokenFromHeader = R.compose(
  R.ifElse(
    splits =>
      // @ts-ignore
      R.length(splits) === 2 &&
      R.compose(
        R.toLower,
        R.defaultTo(''),
        R.head
        // @ts-ignore
      )(splits) === 'bearer',
    R.nth(1),
    R.always(null)
  ),
  R.split(' '),
  R.defaultTo('')
);

const authenticateJWT = async (
  req: RequestWithAuthData,
  res: Response,
  next: NextFunction
) => {
  // Allow access to status without auth.
  if (req.url === '/status') {
    return next();
  }

  // @ts-ignore
  const token = getBearerTokenFromHeader(req.get('Authorization'));

  if (token === null) {
    res
      .status(401)
      .send({ errors: [{ message: 'Unauthorized - Bearer token required' }] });
    return;
  }

  // Fail early if the JWT data isn't valid
  const decodedToken = decode(token, { json: true, complete: true });
  if (decodedToken === null) {
    res.status(401).send({
      errors: [{ message: 'Unauthorized - Bearer token malformed' }]
    });
    return;
  }

  req.authToken = token;

  if (isLegacyToken(decodedToken)) {
    try {
      const legacyCredentials = await getCredentialsForLegacyToken(token);
      req.legacyCredentials = legacyCredentials;

      const { sub, iss } = legacyCredentials;
      const username = sub ? sub : 'unknown';
      const source = iss ? iss : 'unknown';
      userActivityLogger.user_auth(
        `Legacy authentication granted for '${username}' from '${source}'`,
        {
          user: legacyCredentials ? legacyCredentials : null,
          headers: req.headers
        }
      );

      return next();
    } catch (e) {
      res.status(401).send({
        errors: [
          { message: `Unauthorized - Legacy token invalid: ${e.message}` }
        ]
      });
      return;
    }
  } else if (isKeycloakToken(decodedToken)) {
    try {
      const grant: any = await getGrantForKeycloakToken(token);
      req.kauth = { grant };

      const {
        azp: source,
        preferred_username,
        email
      } = grant.access_token.content;
      const username = preferred_username ? preferred_username : 'unknown';

      userActivityLogger.user_auth(
        `Keycloak authentication granted for '${username} (${
          email ? email : 'unknown'
        })' from '${source}'`,
        {
          user: grant ? grant.access_token.content : null,
          headers: req.headers
        }
      );

      return next();
    } catch (e) {
      res.status(401).send({
        errors: [
          { message: `Unauthorized - Keycloak token invalid: ${e.message}` }
        ]
      });
      return;
    }
  } else {
    res.status(401).send({
      errors: [{ message: `Unauthorized - Bearer token unrecognized` }]
    });
    return;
  }
};

export const authMiddleware = [authenticateJWT];
