import * as R from 'ramda';
import { getRedisCache, saveRedisCache } from '../clients/redisClient';
import { verify } from 'jsonwebtoken';
import { logger } from '../loggers/logger';
import { getConfigFromEnv } from '../util/config';
import { isNotNil } from './func';
import { keycloakGrantManager } from '../clients/keycloakClient';
const { userActivityLogger } = require('../loggers/userActivityLogger');
import { User } from '../models/user';
import { Group } from '../models/group';

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

export const getUserProjectIdsFromToken = (
  token
): number[] => {
  const groupRoleIds = token.access_token.content.project_group_roles
  let upids = [];
  for (const r in groupRoleIds) {
    for (const pid in groupRoleIds[r]) {
      upids.indexOf(groupRoleIds[r][pid]) === -1 ? upids.push(groupRoleIds[r][pid]) : ""
    }
  }
  return R.uniq(upids);
};

export const getUserRoleForProjectFromToken = (
  token, projectId
): [string, number[]] => {
  const groupRoleIds = token.access_token.content.project_group_roles
  let upids = [];
  let roles = [];
  for (const r in groupRoleIds) {
    for (const pid in groupRoleIds[r]) {
      upids.indexOf(groupRoleIds[r][pid]) === -1 ? upids.push(groupRoleIds[r][pid]) : ""
      if (projectId == groupRoleIds[r][pid]) {
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

export const keycloakHasPermission = (grant, requestCache, modelClients) => {
  const UserModel = User(modelClients);
  const GroupModel = Group(modelClients);

  return async (resource, scope, attributes: IKeycloakAuthAttributes = {}) => {
    const currentUserId: string = grant.access_token.content.sub;

    // const cacheKey = `${currentUserId}:${resource}:${scope}:${JSON.stringify(
    //   attributes
    // )}`;
    // const resourceScope = { resource, scope, currentUserId, ...attributes };

    // const cachedPermissions = requestCache.get(cacheKey);
    // if (cachedPermissions === true) {
    //   return true;
    // } else if (!cachedPermissions === false) {
    //   userActivityLogger.user_info(
    //     `User does not have permission to '${scope}' on '${resource}'`,
    //     {
    //       user: grant ? grant.access_token.content : null
    //     }
    //   );
    //   throw new KeycloakUnauthorizedError(
    //     `Unauthorized: You don't have permission to "${scope}" on "${resource}": ${JSON.stringify(
    //       attributes
    //     )}`
    //   );
    // }

    // // Check the redis cache before doing a full keycloak lookup.
    // let redisCacheResult: number;
    // try {
    //   const data = await getRedisCache(resourceScope);
    //   redisCacheResult = parseInt(data, 10);
    // } catch (err) {
    //   logger.warn(`Couldn't check redis authz cache: ${err.message}`);
    // }

    // if (redisCacheResult === 1) {
    //   return true;
    // } else if (redisCacheResult === 0) {
    //   userActivityLogger.user_info(
    //     `User does not have permission to '${scope}' on '${resource}'`,
    //     {
    //       user: grant.access_token.content
    //     }
    //   );
    //   throw new KeycloakUnauthorizedError(
    //     `Unauthorized: You don't have permission to "${scope}" on "${resource}": ${JSON.stringify(
    //       attributes
    //     )}`
    //   );
    // }

    const currentUser = await UserModel.loadUserById(currentUserId);
    const serviceAccount = await keycloakGrantManager.obtainFromClientCredentials();

    let claims: {
      currentUser: [string];
      usersQuery?: [string];
      projectQuery?: [string];
      userProjects?: [string];
      userProjectRole?: [string];
      userGroupRole?: [string];
    } = {
      currentUser: [currentUserId]
    };


    logger.info(`A ${JSON.stringify(grant.access_token.token)}`)

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
        currentUser: [currentUserId]
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

        const [highestRoleForProject, userProjects] = await getUserRoleForProjectFromToken(grant, R.prop('project', attributes))

        if (userProjects.length) {
          claims = {
            ...claims,
            userProjects: [userProjects.join('-')]
          };
        }

        if (highestRoleForProject) {
          claims = {
            ...claims,
            userProjectRole: [highestRoleForProject]
          };
        } else {
          // no project or role detected in the token, fall back to checking keycloak
          // this is a heavier operation for users that are in a lot of groups, use the token as often as possible
          // but with the way the api works, sometimes it isn't possible to use the token if it lacks something like a newly created project id

          // logger.debug(`There was no project or role determined for the requested project resource, falling back to checking keycloak the slow way`)

          const [userProjects, userGroups] = await UserModel.getAllProjectsIdsForUser(currentUser);

          if (userProjects.length) {
            claims = {
              ...claims,
              userProjects: [userProjects.join('-')]
            };
          }
          const roles = await UserModel.getUserRolesForProject(
            currentUser,
            projectId,
            userGroups
          );

          const highestRoleForProject = getHighestRole(roles);

          if (highestRoleForProject) {
            claims = {
              ...claims,
              userProjectRole: [highestRoleForProject]
            };
          }
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

        const groupRoles = R.pipe(
          R.filter(membership =>
            R.pathEq(['user', 'id'], currentUserId, membership)
          ),
          R.pluck('role')
        )(group.members);

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
        // requestCache.set(cacheKey, true);
        // try {
        //   await saveRedisCache(resourceScope, 1);
        // } catch (err) {
        //   logger.warn(`Couldn't save redis authz cache: ${err.message}`);
        // }

        return;
      }
    } catch (err) {
      // Keycloak library doesn't distinguish between a request error or access
      // denied conditions.
      userActivityLogger.user_info(
        `User does not have permission to '${scope}' on '${resource}'`,
        {
          user: currentUserId
        }
      );
    }

    // requestCache.set(cacheKey, false);
    // TODO: Re-enable when we can distinguish between error and access denied
    // try {
    //   await saveRedisCache(resourceScope, 0);
    // } catch (err) {
    //   logger.warn(`Couldn't save redis authz cache: ${err.message}`);
    // }
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
