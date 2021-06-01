import * as R from 'ramda';
import { Request, Response, NextFunction } from 'express';
import { logger } from './loggers/logger';
import {
  getGrantForKeycloakToken,
  getCredentialsForLegacyToken
} from './util/auth';
import { getUserActivityLogger } from './loggers/userActivityLogger';

export type RequestWithAuthData = Request & {
  legacyCredentials: any;
  authToken: string;
  kauth: any;
};

const parseBearerToken = R.compose(
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

const prepareToken = async (
  req: RequestWithAuthData,
  res: Response,
  next: NextFunction
) => {
  // Allow access to status without auth.
  if (req.url === '/status') {
    next();
    return;
  }

  // @ts-ignore
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
  req: RequestWithAuthData,
  res: Response,
  next: NextFunction
) => {
  // Allow access to status without auth.
  if (req.url === '/status') {
    next();
    return;
  }

  try {
    const grant: any = await getGrantForKeycloakToken(req.authToken);

    req.kauth = { grant };
    const userActivityLogger = getUserActivityLogger(
      grant ? grant : null
    );

    const { azp: source, preferred_username, email } = grant.access_token.content;
    const username = preferred_username ? preferred_username : 'unknown';

    userActivityLogger.user_auth(`Keycloak authentication granted for '${username} (${email ? email : 'unknown'})' from '${source}'`);

  } catch (e) {
    // It might be a legacy token, so continue on.
    logger.debug(`Keycloak token auth failed: ${e.message}`);
  }

  next();
};

const legacy = async (
  req: RequestWithAuthData,
  res: Response,
  next: NextFunction
) => {
  // Allow access to status without auth.
  if (req.url === '/status') {
    next();
    return;
  }

  // Allow keycloak authenticated sessions
  if (req.kauth) {
    next();
    return;
  }

  try {
    const legacyCredentials = await getCredentialsForLegacyToken(req.authToken);

    req.legacyCredentials = legacyCredentials;

    const userActivityLogger = getUserActivityLogger(legacyCredentials ? legacyCredentials : null);
    const { sub, iss } = legacyCredentials;
    const username = sub ? sub : 'unknown';
    const source = iss ? iss : 'unknown';
    userActivityLogger.user_auth(`Legacy authentication granted for '${username}' from '${source}'`);

    next();
  } catch (e) {
    res.status(403).send({
      errors: [{ message: `Forbidden - Invalid Auth Token: ${e.message}` }]
    });
  }
};

export const authMiddleware = [
  prepareToken,
  // First attempt to validate token with keycloak.
  keycloak,
  // Then validate legacy token.
  legacy
];
