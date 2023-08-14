import * as R from 'ramda';
import { verify } from 'jsonwebtoken';
import { logger } from '../loggers/logger';
import { getConfigFromEnv } from '../util/config';
import { isNotNil } from './func';
import { keycloakGrantManager } from '../clients/keycloakClient';
const { userActivityLogger } = require('../loggers/userActivityLogger');
import { Group } from '../models/group';
import { User } from '../models/user';
import { saveRedisCache, getRedisCache, saveRedisKeycloakCache } from '../clients/redisClient';

interface ILegacyToken {
  iat: string;
  iss: string;
  sub: string;
  aud: string;
  role: string;
}

export interface IKeycloakAuthAttributes {
  project?: number;
  group?: string;
  users?: number[];
}

const sortRolesByWeight = (a, b) => {
  const roleWeights = {
    guest: 1,
    reporter: 2,
    developer: 3,
    maintainer: 4,
    owner: 5
  };

  if (roleWeights[a] < roleWeights[b]) {
    return -1;
  } else if (roleWeights[a] > roleWeights[b]) {
    return 1;
  }

  return 0;
};

export const getUserProjectIdsFromRoleProjectIds = (
  roleProjectIds
): number[] => {
  // https://github.com/uselagoon/lagoon/pull/3358 references potential issue with the lagoon-projects attribute where there could be empty values
  // the structure of this payload is:
  /*
    {"guest":[13],"devloper":[20,14],"maintainer":[13,18,19,12]}
  */
  let upids = [];
  for (const r in roleProjectIds) {
    for (const pid in roleProjectIds[r]) {
      upids.indexOf(roleProjectIds[r][pid]) === -1 ? upids.push(roleProjectIds[r][pid]) : ""
    }
  }
  return R.uniq(upids);
};

export const getUserRoleForProjectFromRoleProjectIds = (
  roleProjectIds, projectId
): [string, number[]] => {
  let upids = [];
  let roles = [];
  for (const r in roleProjectIds) {
    for (const pid in roleProjectIds[r]) {
      upids.indexOf(roleProjectIds[r][pid]) === -1 ? upids.push(roleProjectIds[r][pid]) : ""
      if (projectId == roleProjectIds[r][pid]) {
        roles.push(r)
      }
    }
  }

  const highestRoleForProject = getHighestRole(roles);

  return [highestRoleForProject, R.uniq(upids)];
};

const getHighestRole = (roles) => {
  return R.pipe(
    R.uniq,
    R.reject(R.isEmpty),
    R.reject(R.isNil),
    R.sort(sortRolesByWeight),
    R.last
  )(roles);
};

export const isLegacyToken = R.pathSatisfies(isNotNil, ['payload', 'role']);
export const isKeycloakToken = R.pathSatisfies(isNotNil, ['payload', 'typ']);

export const getGrantForKeycloakToken = async token =>
  keycloakGrantManager.createGrant({
    access_token: token
  });

export const getCredentialsForLegacyToken = async token => {
  let decoded: ILegacyToken;
  decoded = verify(token, getConfigFromEnv('JWTSECRET'));

  if (decoded == null) {
    throw new Error('Decoding token resulted in "null" or "undefined".');
  }

  const { role = 'none', aud, sub, iss, iat } = decoded;

  if (aud !== getConfigFromEnv('JWTAUDIENCE')) {
    throw new Error('Token audience mismatch.');
  }

  if (role !== 'admin') {
    throw new Error('Cannot authenticate non-admin user with legacy token.');
  }

  return {
    iat,
    sub,
    iss,
    aud,
    role,
    permissions: {}
  };
};

// Legacy tokens should only be granted by services, which will have admin role.
export const legacyHasPermission = legacyCredentials => {
  const { role } = legacyCredentials;

  return async (resource, scope) => {
    if (role !== 'admin') {
      userActivityLogger.user_info(
        `User does not have permission to '${scope}' on '${resource}'`,
        {
          user: legacyCredentials ? legacyCredentials : null
        }
      );
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

export const keycloakHasPermission = (grant, requestCache, modelClients, serviceAccount, currentUser, groupRoleProjectIds) => {
  const GroupModel = Group(modelClients);
  const UserModel = User(modelClients);

  return async (resource, scope, attributes: IKeycloakAuthAttributes = {}) => {

    // Check if the same set of permissions has been granted already for this
    // api query.
    const cacheKey = `${currentUser.id}:${resource}:${scope}:${JSON.stringify(
      attributes
    )}`;
    const cachedPermissions = requestCache.get(cacheKey);
    if (cachedPermissions === true) {
      return true;
    } else if (!cachedPermissions === false) {
      userActivityLogger.user_info(
        `User does not have permission to '${scope}' on '${resource}'`,
        {
          user: grant ? grant.access_token.content : null
        }
      );
      throw new KeycloakUnauthorizedError(
        `Unauthorized: You don't have permission to "${scope}" on "${resource}": ${JSON.stringify(
          attributes
        )}`
      );
    }

    // Check the redis cache before doing a full keycloak lookup.
    const resourceScope = { resource, scope, currentUserId: currentUser.id, ...attributes };
    let redisCacheResult: number;
    try {
      const data = await getRedisCache(resourceScope);
      redisCacheResult = parseInt(data, 10);
    } catch (err) {
      logger.warn(`Couldn't check redis authz cache: ${err.message}`);
    }

    if (redisCacheResult === 1) {
      return true;
    } else if (redisCacheResult === 0) {
      userActivityLogger.user_info(
        `User does not have permission to '${scope}' on '${resource}'`,
        {
          user: grant.access_token.content
        }
      );
      throw new KeycloakUnauthorizedError(
        `Unauthorized: You don't have permission to "${scope}" on "${resource}": ${JSON.stringify(
          attributes
        )}`
      );
    }

    let claims: {
      currentUser: [string];
      usersQuery?: [string];
      projectQuery?: [string];
      userProjects?: [string];
      userProjectRole?: [string];
      userGroupRole?: [string];
    } = {
      currentUser: [currentUser.id]
    };


    const usersAttribute = R.prop('users', attributes);
    if (usersAttribute && usersAttribute.length) {
      claims = {
        ...claims,
        usersQuery: [
          R.compose(
            R.join('|'),
            R.prop('users')
          )(attributes)
        ],
        currentUser: [currentUser.id]
      };
    }

    if (R.prop('project', attributes)) {
      // TODO: This shouldn't be needed when typescript is implemented top down?
      // @ts-ignore
      const projectId = parseInt(R.prop('project', attributes), 10);

      try {
        claims = {
          ...claims,
          projectQuery: [`${projectId}`]
        };

        let [highestRoleForProject, upids] = getUserRoleForProjectFromRoleProjectIds(groupRoleProjectIds, projectId)

        if (!highestRoleForProject) {
          // if no role is detected, fall back to checking the slow way. this is usually only going to be on project creation
          // but could happen elsewhere
          const keycloakUsersGroups = await UserModel.getAllGroupsForUser(currentUser.id);
          // grab the users project ids and roles in the first request
          groupRoleProjectIds = await UserModel.getAllProjectsIdsForUser(currentUser, keycloakUsersGroups);

          [highestRoleForProject, upids] = getUserRoleForProjectFromRoleProjectIds(groupRoleProjectIds, projectId)
        }

        if (upids.length) {
          claims = {
            ...claims,
            userProjects: [upids.join('-')]
          };
        }

        if (highestRoleForProject) {
          claims = {
            ...claims,
            userProjectRole: [highestRoleForProject]
          };
        }
      } catch (err) {
        logger.error(
          `Couldn't submit project (${projectId}) claims for authz request: ${err.message}`
        );
      }
    }

    if (R.prop('group', attributes)) {
      try {
        const group = await GroupModel.loadGroupById(
          R.prop('group', attributes)
        );

        const groupMembers = await GroupModel.getGroupMembership(group)

        const groupRoles = R.pipe(
          R.filter(membership =>
            R.pathEq(['user', 'id'], currentUser.id, membership)
          ),
          R.pluck('role')
        )(groupMembers);

        const highestRoleForGroup = R.pipe(
          R.uniq,
          R.reject(R.isEmpty),
          R.reject(R.isNil),
          R.sort(sortRolesByWeight),
          R.last
        )(groupRoles);

        if (highestRoleForGroup) {
          claims = {
            ...claims,
            userGroupRole: [highestRoleForGroup]
          };
        }
      } catch (err) {
        logger.error(
          `Couldn't submit group (${R.prop(
            'group',
            attributes
          )}) claims for authz request: ${err.message}`
        );
      }
    }

    // Ask keycloak for a new token (RPT).
    let authzRequest: {
      permissions: object[];
      claim_token_format?: string;
      claim_token?: string;
    } = {
      permissions: [
        {
          id: resource,
          scopes: [scope]
        }
      ]
    };

    if (!R.isEmpty(claims)) {
      authzRequest = {
        ...authzRequest,
        claim_token_format: 'urn:ietf:params:oauth:token-type:jwt',
        claim_token: Buffer.from(JSON.stringify(claims)).toString('base64')
      };
    }

    const request = {
      headers: {},
      kauth: {
        grant: serviceAccount
      }
    };

    try {
      // @ts-ignore
      const newGrant = await keycloakGrantManager.checkPermissions(
        authzRequest,
        request
      );

      if (newGrant.access_token.hasPermission(resource, scope)) {
        requestCache.set(cacheKey, true);
        try {
          await saveRedisCache(resourceScope, '1');
        } catch (err) {
          logger.warn(`Couldn't save redis authz cache: ${err.message}`);
        }
        return;
      }
    } catch (err) {
      // Keycloak library doesn't distinguish between a request error or access
      // denied conditions.
      userActivityLogger.user_info(
        `User does not have permission to '${scope}' on '${resource}'`,
        {
          user: currentUser.id
        }
      );
    }

    userActivityLogger.user_info(
      `User does not have permission to '${scope}' on '${resource}'`,
      {
        user: grant.access_token.content
      }
    );
    throw new KeycloakUnauthorizedError(
      `Unauthorized: You don't have permission to "${scope}" on "${resource}": ${JSON.stringify(
        attributes
      )}`
    );
  };
};
