const Keycloak = require('keycloak-connect');
const Setup = require('keycloak-connect/middleware/setup');
const GrantAttacher = require('keycloak-connect/middleware/grant-attacher');
const R = require('ramda');
const { getPermissionsForUser } = require('./util/auth');

const lagoonRoutes =
  (process.env.LAGOON_ROUTES && process.env.LAGOON_ROUTES.split(',')) || [];

const lagoonKeycloakRoute = lagoonRoutes.find(routes =>
  routes.includes('keycloak-')
);

const keycloak = new Keycloak(
  {},
  {
    realm: 'lagoon',
    serverUrl: lagoonKeycloakRoute || 'http://keycloak:8080/auth',
    clientId: 'lagoon-ui',
    publicClient: true,
    bearerOnly: true,
  },
);

// Override default of returning a 403
keycloak.accessDenied = (req, res, next) => {
  next();
};

const authWithKeycloak = async (req, res, next) => {
  if (!req.kauth.grant) {
    next();
    return;
  }

  const ctx = req.app.get('context');
  const dao = ctx.dao;

  try {
    const {
      content: {
        lagoon: { user_id: userId },
      },
    } = req.kauth.grant.access_token;

    const permissions = await getPermissionsForUser(dao, userId);

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

    next();
  } catch (e) {
    res.status(403).send({
      errors: [{ message: `!Forbidden - Invalid Auth Token: ${e.message}` }],
    });
  }
};

const authKeycloakMiddleware = () => [
  Setup,
  GrantAttacher(keycloak),
  authWithKeycloak,
];

module.exports = {
  authKeycloakMiddleware,
};
