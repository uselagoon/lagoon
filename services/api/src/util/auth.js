const R = require('ramda');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const { keycloakGrantManager } = require('../clients/keycloakClient');
const User = require('../models/user');
const Group = require('../models/group');

const UserModel = User.User();
const GroupModel = Group.Group();

const { JWTSECRET, JWTAUDIENCE } = process.env;

const sortRolesByWeight = (a, b) => {
  const roleWeights = {
    guest: 1,
    reporter: 2,
    developer: 3,
    maintainer: 4,
    owner: 5,
  };

  if (roleWeights[a] < roleWeights[b]) {
    return -1;
  } else if (roleWeights[a] > roleWeights[b]) {
    return 1;
  }

  return 0;
};

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
  return async (resource, scope, attributes = {}) => {
    const currentUserId = grant.access_token.content.sub;

    const serviceAccount = await keycloakGrantManager.obtainFromClientCredentials();

    let claims = {
      currentUser: [currentUserId],
    };

    const usersAttribute = R.prop('users', attributes);
    if (usersAttribute && usersAttribute.length) {
      claims = {
        ...claims,
        usersQuery: [
          R.compose(
            R.join('|'),
            R.prop('users'),
          )(attributes),
        ],
        currentUser: [currentUserId],
      };
    }

    if (R.prop('project', attributes)) {
      try {
        claims = {
          ...claims,
          projectQuery: [R.prop('project', attributes)],
        };

        const userProjects = await UserModel.getAllProjectsIdsForUser({
          id: currentUserId,
        });

        if (userProjects.length) {
          claims = {
            ...claims,
            userProjects: [userProjects.join('-')],
          };
        }

        const roles = await UserModel.getUserRolesForProject({
          id: currentUserId,
        }, R.prop('project', attributes));

        const highestRoleForProject = R.pipe(
          R.uniq,
          R.reject(R.isEmpty),
          R.reject(R.isNil),
          R.sort(sortRolesByWeight),
          R.last,
        )(roles);

        if (highestRoleForProject) {
          claims = {
            ...claims,
            userProjectRole: [highestRoleForProject],
          };
        }
      } catch (err) {
        logger.error(`Could not submit project (${R.prop('project', attributes)}) claims for authz request: ${err.message}`);
      }
    }

    if (R.prop('group', attributes)) {
      try {
        const group = await GroupModel.loadGroupById(R.prop('group', attributes));

        const groupRoles = R.pipe(
          R.filter(membership =>
            R.pathEq(['user', 'id'], currentUserId, membership),
          ),
          R.pluck('role'),
        )(group.members);

        const highestRoleForGroup = R.pipe(
          R.uniq,
          R.reject(R.isEmpty),
          R.reject(R.isNil),
          R.sort(sortRolesByWeight),
          R.last,
        )(groupRoles);

        if (highestRoleForGroup) {
          claims = {
            ...claims,
            userGroupRole: [highestRoleForGroup],
          };
        }
      } catch (err) {
        logger.error(`Could not submit group (${R.prop('group', attributes)}) claims for authz request: ${err.message}`);
      }
    }

    // Ask keycloak for a new token (RPT).
    let authzRequest = {
      permissions: [
        {
          id: resource,
          scopes: [scope],
        },
      ],
    };

    if (!R.isEmpty(claims)) {
      authzRequest = {
        ...authzRequest,
        claim_token_format: 'urn:ietf:params:oauth:token-type:jwt',
        claim_token: Buffer.from(JSON.stringify(claims)).toString('base64'),
      };
    }

    const request = {
      headers: {},
      kauth: {
        grant: serviceAccount,
      },
    };

    try {
      const newGrant = await keycloakGrantManager.checkPermissions(authzRequest, request);

      if (newGrant.access_token.hasPermission(resource, scope)) {
        return;
      }
    } catch (err) {
      // Keycloak library doesn't distinguish between a request error or access
      // denied conditions.
    }

    throw new Error(`Unauthorized: You don't have permission to "${scope}" on "${resource}".`);
  };
};

module.exports = {
  getCredentialsForLegacyToken,
  getGrantForKeycloakToken,
  legacyHasPermission,
  keycloakHasPermission,
};
