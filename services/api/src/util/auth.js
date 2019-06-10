const R = require('ramda');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const { query, prepare } = require('../util/db');
const { keycloakGrantManager } = require('../clients/keycloakClient');

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

const getPermissions = async (sqlClient, args) => {
  const prep = prepare(
    sqlClient,
    'SELECT projects, customers FROM permission WHERE user_id = :user_id',
  );
  const rows = await query(sqlClient, prep(args));

  return R.propOr(null, 0, rows);
};

const getPermissionsForUser = async (sqlClient, userId) => {
  const rawPermissions = await getPermissions(sqlClient, { userId });

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

const getCredentialsForKeycloakToken = async (sqlClient, token) => {
  let grant = '';
  try {
    grant = await keycloakGrantManager.createGrant({
      access_token: token,
    });
  } catch (e) {
    throw new Error(`Error decoding token: ${e.message}`);
  }

  const decoded = grant.access_token.content;
  let nonAdminCreds = {};

  if (!R.contains('admin', decoded.realm_access.roles)) {
    const {
      lagoon: { user_id: userId },
    } = decoded;
    const permissions = await getPermissionsForUser(sqlClient, userId);

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

const getCredentialsForLegacyToken = async (sqlClient, token) => {
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

  const { userId, permissions, role = 'none' } = decoded;

  if (role === 'admin') {
    return {
      role,
      permissions: {},
    };
  }

  // Get permissions for user, override any from JWT.
  if (userId) {
    const dbPermissions = await getPermissionsForUser(sqlClient, userId);

    if (R.isEmpty(dbPermissions)) {
      throw new Error(`No permissions for user id ${userId}.`);
    }

    return {
      userId,
      role,
      permissions: dbPermissions,
    };
  }

  // Use permissions from JWT.
  if (permissions) {
    return {
      role,
      permissions,
    };
  }

  throw new Error(
    'Cannot authenticate non-admin user with no userId or permissions.',
  );
};

module.exports = {
  splitCommaSeparatedPermissions,
  getCredentialsForLegacyToken,
  getCredentialsForKeycloakToken,
};
