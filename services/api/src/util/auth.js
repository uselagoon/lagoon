const jwt = require('jsonwebtoken');
const logger = require('../logger');
const { keycloakGrantManager } = require('../clients/keycloakClient');

const { JWTSECRET, JWTAUDIENCE } = process.env;

const getGrantForKeycloakToken = async (sqlClient, token) => {
  let grant = '';
  try {
    grant = await keycloakGrantManager.createGrant({
      access_token: token,
    });
  } catch (e) {
    throw new Error(`Error decoding token: ${e.message}`);
  }

  return grant;
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

  const { role = 'none' } = decoded;

  if (role !== 'admin') {
    throw new Error('Cannot authenticate non-admin user with legacy token.');
  }

  return {
    role,
    permissions: {},
  };
};

// Legacy tokens should only be granted by services, which will have admin role.
const legacyHasPermission = (legacyCredentials) => {
  const { role } = legacyCredentials;

  return async (resource, scope) => {
    if (role !== 'admin') {
      throw new Error('Unauthorized');
    }
  };
};

const keycloakHasPermission = (grant) => {
  return async (resource, scopeInput, attributes = {}) => {
    const scopes = (typeof scopeInput === 'string') ? [scopeInput] : scopeInput;

    const serviceAccount = await keycloakGrantManager.obtainFromClientCredentials();

    // Add current userId, user project ids
    // Add max project role
    // Add max group role
    // const claims = {
    //   foo: ['baz'],
    // };

    // Ask keycloak for a new token (RPT).
    const authzRequest = {
      // claim_token: Buffer.from(JSON.stringify(claims)).toString('base64'),
      // claim_token_format: 'urn:ietf:params:oauth:token-type:jwt',
      permissions: [
        {
          id: resource,
          scopes,
        },
      ],
    };
    const request = {
      headers: {},
      kauth: {
        grant: serviceAccount,
      },
    };

    try {
      const newGrant = await keycloakGrantManager.checkPermissions(authzRequest, request);

      for (const scope of scopes) {
        if (newGrant.access_token.hasPermission(resource, scope)) {
          return;
        }
      }
    } catch (err) {
      // Keycloak library doesn't distinguish between a request error or access
      // denied conditions.
      throw new Error('Unauthorized');
    }

    throw new Error('Unauthorized');
  };
};

module.exports = {
  getCredentialsForLegacyToken,
  getGrantForKeycloakToken,
  legacyHasPermission,
  keycloakHasPermission,
};
