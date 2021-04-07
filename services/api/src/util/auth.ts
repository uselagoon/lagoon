import * as R from 'ramda';
import { getRedisCache, saveRedisCache } from '../clients/redisClient';
import { verify } from 'jsonwebtoken';
const logger = require('../loggers/logger');
const userActivityLogger = require('../loggers/userActivityLogger');
import { keycloakGrantManager } from'../clients/keycloakClient';
import { User } from '../models/user';
import { Group } from '../models/group';

const { JWTSECRET, JWTAUDIENCE } = process.env;

interface ILegacyToken {
  iat: string,
  iss: string,
  sub: string,
  aud: string,
  role: string,
}

interface IKeycloakAuthAttributes {
  project?: number,
  group?: string,
  users?: number[],
};

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

export const getGrantForKeycloakToken = async (sqlClient, token) => {
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

export const getCredentialsForLegacyToken = async (sqlClient, token) => {
  let decoded: ILegacyToken;
  try {
    decoded = verify(token, JWTSECRET);

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

  const { role = 'none', aud, sub, iss, iat } = decoded;

  if (role !== 'admin') {
    throw new Error('Cannot authenticate non-admin user with legacy token.');
  }

  return {
    iat,
    sub,
    iss,
    aud,
    role,
    permissions: {},
  };
};

// Legacy tokens should only be granted by services, which will have admin role.
export const legacyHasPermission = (legacyCredentials) => {
  const { role } = legacyCredentials;

  return async (resource, scope) => {
    if (role !== 'admin') {
      throw new Error('Unauthorized');
    }
  };
};

export class KeycloakUnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'KeycloakUnauthorizedError';
  }
}

export const keycloakHasPermission = (grant, requestCache, keycloakAdminClient) => {
  const UserModel = User({ keycloakAdminClient });
  const GroupModel = Group({ keycloakAdminClient });

  return async (resource, scope, attributes: IKeycloakAuthAttributes = {}) => {
    const currentUserId: string = grant.access_token.content.sub;

    // Check if the same set of permissions has been granted already for this
    // api query.
    // TODO Is it possible to ask keycloak for ALL permissions (given a project
    // or group context) and cache a single query instead?
    const cacheKey = `${currentUserId}:${resource}:${scope}:${JSON.stringify(attributes)}`;
    const cachedPermissions = requestCache.get(cacheKey);
    if (cachedPermissions === true) {
      return true;
    } else if (!cachedPermissions === false) {
      userActivityLogger.user_info(`User does not have permission to '${scope}' on '${resource}'`, {
        user: grant.access_token.content
      });
      throw new KeycloakUnauthorizedError(`Unauthorized: You don't have permission to "${scope}" on "${resource}".`);
    }

    // Check the redis cache before doing a full keycloak lookup.
    const resourceScope = {resource, scope, currentUserId, ...attributes };
    let redisCacheResult: number;
    try {
      const data = await getRedisCache(resourceScope);
      redisCacheResult = parseInt(data, 10);
    } catch (err) {
      logger.warn(`Could not lookup authz cache: ${err.message}`);
    }

    if (redisCacheResult === 1) {
      return true;
    } else if (redisCacheResult === 0) {
      logger.debug(`Redis authz cache returned denied for ${JSON.stringify(resourceScope)}`);
      userActivityLogger.user_info(`User does not have permission to '${scope}' on '${resource}'`, {
        user: grant.access_token.content
      });
      throw new KeycloakUnauthorizedError(`Unauthorized: You don't have permission to "${scope}" on "${resource}".`);
    }


    const currentUser = await UserModel.loadUserById(currentUserId);
    const serviceAccount = await keycloakGrantManager.obtainFromClientCredentials();

    let claims: {
      currentUser: [string],
      usersQuery?: [string],
      projectQuery?: [string],
      userProjects?: [string],
      userProjectRole?: [string],
      userGroupRole?: [string],
    } = {
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
      // TODO: This shouldn't be needed when typescript is implemented top down?
      // @ts-ignore
      const projectId = parseInt(R.prop('project', attributes), 10);

      try {
        claims = {
          ...claims,
          projectQuery: [`${projectId}`],
        };

        const userProjects = await UserModel.getAllProjectsIdsForUser(currentUser);

        if (userProjects.length) {
          claims = {
            ...claims,
            userProjects: [userProjects.join('-')],
          };
        }

        const roles = await UserModel.getUserRolesForProject(currentUser, projectId);

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
        logger.error(`Could not submit project (${projectId}) claims for authz request: ${err.message}`);
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
    let authzRequest: {
      permissions: object[],
      claim_token_format?: string,
      claim_token?: string,
    } = {
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
        requestCache.set(cacheKey, true);
        try {
          await saveRedisCache(resourceScope, 1);
        } catch (err) {
          logger.warn(`Could not save authz cache: ${err.message}`);
        }

        return;
      }
    } catch (err) {
      // Keycloak library doesn't distinguish between a request error or access
      // denied conditions.
      logger.debug(`keycloakHasPermission denied for '${currentUser.username}' trying to "${scope}" on "${resource}": ${err.message}`);
    }

    requestCache.set(cacheKey, false);
    // TODO: Re-enable when we can distinguish between error and access denied
    // try {
    //   await saveRedisCache(resourceScope, 0);
    // } catch (err) {
    //   logger.warn(`Could not save authz cache: ${err.message}`);
    // }
    userActivityLogger.user_info(`User does not have permission to '${scope}' on '${resource}'`, {
      user: grant.access_token.content
    });
    throw new KeycloakUnauthorizedError(`Unauthorized: You don't have permission to "${scope}" on "${resource}".`);
  };
};
