const util = require('util');
const R = require('ramda');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios');
const logger = require('../logger');
const sqlClient = require('../clients/sqlClient');
const { query, prepare } = require('../util/db');

const { JWTSECRET, JWTAUDIENCE } = process.env;

const notEmptyOrNaN /* : Function */ = R.allPass([
  R.compose(
    R.not,
    R.isEmpty,
  ),
  R.compose(
    R.not,
    R.equals(NaN),
  ),
]);

// Input: Comma-separated string with ids (defaults to '' if null)
// Output: Array of ids as strings
const splitCommaSeparatedPermissions /* :  (?string) => Array<string> */ = R.compose(
  // MariaDB returns number ids as strings. In order to avoid
  // having to compare numbers with strings later on, this
  // function casts them back to string.
  R.map(R.toString),
  R.filter(notEmptyOrNaN),
  R.map(strId => parseInt(strId)),
  R.split(','),
  R.defaultTo(''),
);

const getPermissions = async args => {
  const prep = prepare(
    sqlClient,
    'SELECT projects, customers FROM permission WHERE user_id = :user_id',
  );
  const rows = await query(sqlClient, prep(args));

  return R.propOr(null, 0, rows);
};

const getPermissionsForUser = async userId => {
  const rawPermissions = await getPermissions({ userId });

  if (rawPermissions == null) {
    return {};
  }

  // Split comma-separated permissions values to arrays
  const permissions = R.compose(
    R.over(R.lensProp('customers'), splitCommaSeparatedPermissions),
    R.over(R.lensProp('projects'), splitCommaSeparatedPermissions),
    R.defaultTo({}),
  )(rawPermissions);

  return permissions;
};

// Attempt to load signing key from Keycloak API.
const fetchKeycloakKey = async (header, cb) => {
  const lagoonRoutes =
    (process.env.LAGOON_ROUTES && process.env.LAGOON_ROUTES.split(',')) || [];

  const lagoonKeycloakRoute = lagoonRoutes.find(routes =>
    routes.includes('keycloak-'),
  );

  const authServerUrl = lagoonKeycloakRoute
    ? `${lagoonKeycloakRoute}/auth`
    : 'http://docker.for.mac.localhost:8088/auth';

  try {
    const response = await axios.get(`${authServerUrl}/realms/lagoon/protocol/openid-connect/certs`);
    const jwks = response.data.keys;

    const jwk = jwks.find(key => key.kid === header.kid);

    if (!jwk) {
      throw new Error('No keycloak key found for realm lagoon.');
    }

    cb(null, jwkToPem(jwk));
  } catch (e) {
    cb(e);
  }
};

const getCredentialsForKeycloakToken = async token => {
  const decodeToken = util.promisify(jwt.verify);

  // Check for a valid keycloak token before cryptographically verifying it to
  // save a network request.
  const { azp } = jwt.decode(token);
  if (!azp || azp !== 'lagoon-ui') {
    throw new Error('Not a recognized Keycloak token.');
  }

  let decoded = '';
  try {
    decoded = await decodeToken(token, fetchKeycloakKey);

    if (decoded == null) {
      throw new Error('Decoding token resulted in "null" or "undefined".');
    }
  } catch (e) {
    throw new Error(`Error decoding token: ${e.message}`);
  }

  let nonAdminCreds = {};

  if (!R.contains(
    'admin',
    decoded.realm_access.roles,
  )) {
    const {
      lagoon: { user_id: userId },
    } = decoded;
    const permissions = await getPermissionsForUser(userId);

    if (R.isEmpty(permissions)) {
      throw new Error(`No permissions for user id ${userId}.`);
    }

    nonAdminCreds = {
      userId,
      role: 'none',
      // Read and write permissions
      permissions,
    };
  }

  return {
    role: 'admin',
    permissions: {},
    ...nonAdminCreds,
  };
};

const getCredentialsForLegacyToken = async token => {
  let decoded = '';
  try {
    decoded = jwt.verify(token, JWTSECRET);

    if (decoded == null) {
      throw new Error('Decoding token resulted in "null" or "undefined".');
    }

    const { aud } = decoded;

    if (JWTAUDIENCE && aud !== JWTAUDIENCE) {
      logger.info(`Invalid token with aud attribute: "${aud || ''}"`);
      throw new Error('Token audience mismatch.');
    }
  } catch (e) {
    throw new Error(`Error decoding token: ${e.message}`);
  }

  const { userId, role = 'none' } = decoded;

  // We need this, since non-admin credentials are required to have an user id
  let nonAdminCreds = {};

  if (role !== 'admin') {
    const permissions = await getPermissionsForUser(userId);

    if (R.isEmpty(permissions)) {
      throw new Error(`No permissions for user id ${userId}.`);
    }

    nonAdminCreds = {
      userId,
      // Read and write permissions
      permissions,
    };
  }

  return {
    role,
    permissions: {},
    ...nonAdminCreds,
  };
};

module.exports = {
  getPermissionsForUser,
  splitCommaSeparatedPermissions,
  getCredentialsForLegacyToken,
  getCredentialsForKeycloakToken,
};
