// @flow

const Keycloak = require('keycloak-connect');
const Setup = require('keycloak-connect/middleware/setup');
const GrantAttacher = require('keycloak-connect/middleware/grant-attacher');
const R = require('ramda');
const { getPermissionsForUser } = require('./util/auth');

const lagoonRoutes =
  (process.env.LAGOON_ROUTES && process.env.LAGOON_ROUTES.split(',')) || [];

const lagoonKeycloakRoute = lagoonRoutes.find(routes =>
  routes.includes('keycloak-'),
);

const keycloak = new Keycloak(
  {},
  {
    realm: 'lagoon',
    serverUrl: lagoonKeycloakRoute
      ? `${lagoonKeycloakRoute}/auth`
      : 'http://docker.for.mac.localhost:8088/auth',
    clientId: 'lagoon-ui',
    publicClient: true,
    bearerOnly: true,
  },
);

// Override default of returning a 403
keycloak.accessDenied = (req, res, next) => {
  console.log('keycloak.accessDenied');
  next();
};

/* ::
import type { $Request, $Response, Middleware, NextFunction } from 'express';

type CreateAuthMiddlewareArgs = {
  baseUri: string,
  jwtSecret: string,
  jwtAudience: string,
};

class Request extends express$Request {
  credentials: any
  kauth: any
};

type AuthWithKeycloakFn =
    (
      // To allow extending the request object with Flow
      Request,
      $Response,
      NextFunction
    ) =>
      Promise<void>

*/

const authWithKeycloak /* : AuthWithKeycloakFn */ = async (req, res, next) => {
  if (!req.kauth.grant) {
    next();
    return;
  }

  try {
    // Admins have full access and don't need a list of permissions
    if (
      R.contains(
        'admin',
        req.kauth.grant.access_token.content.realm_access.roles,
      )
    ) {
      req.credentials = {
        role: 'admin',
        permissions: {},
      };
    } else {
      const {
        content: {
          lagoon: { user_id: userId },
        },
      } = req.kauth.grant.access_token;

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

      req.credentials = {
        role: 'none',
        userId,
        // Read and write permissions
        permissions,
      };
    }
    next();
  } catch (e) {
    res.status(403).send({
      errors: [
        {
          message: `Forbidden - Invalid Keycloak Token: ${e.message}`,
        },
      ],
    });
  }
};

const authKeycloakMiddleware = () /* : Array<Middleware> */ => [
  Setup,
  GrantAttacher(keycloak),
  authWithKeycloak,
];

module.exports = {
  authKeycloakMiddleware,
};
