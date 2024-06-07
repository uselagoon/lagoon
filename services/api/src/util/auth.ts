import * as R from 'ramda';
import { verify } from 'jsonwebtoken';
import { logger } from '../loggers/logger';
import { getConfigFromEnv } from '../util/config';
import { isNotNil } from './func';
import { keycloakGrantManager } from '../clients/keycloakClient';
const { userActivityLogger } = require('../loggers/userActivityLogger');
import { Group } from '../models/group';
import { User } from '../models/user';

interface ILegacyToken {
  iat: string;
  exp: string;
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

  const { role = 'none', aud, sub, iss, iat, exp } = decoded;

  // check the expiration on legacy tokens, reject them if necessary
  const maxExpiry = getConfigFromEnv('LEGACY_EXPIRY_MAX', '3600') // 1hour default
  const rejectLegacyExpiry = getConfigFromEnv('LEGACY_EXPIRY_REJECT', 'false') // don't reject intially, just log
  if (exp) {
    if ((parseInt(exp)-parseInt(iat)) > parseInt(maxExpiry)) {
      const msg = `Legacy token (sub:${sub}; iss:${iss}) expiry ${(parseInt(exp)-parseInt(iat))} is greater than ${parseInt(maxExpiry)}`
      logger.warn(msg);
      if (rejectLegacyExpiry == "true") {
        throw new Error(msg);
      }
    }
  } else {
    const msg = `Legacy token (sub:${sub}; iss:${iss}) has no expiry`
    logger.warn(msg);
    if (rejectLegacyExpiry == "true") {
      throw new Error(msg);
    }
  }

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

    let claims: {
      currentUser: [string];
      usersQuery?: [string];
      projectQuery?: [string];
      userProjects?: [string];
      userProjectRole?: [string];
      userGroupRole?: [string];
      organizationQuery?: [string];
      userOrganizations?: [string];
      userOrganizationsView?: [string];
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

    // check organization attributes
    if (R.prop('lagoon-organizations', currentUser.attributes)) {
      claims = {
        ...claims,
        userOrganizations: [`${R.prop('lagoon-organizations', currentUser.attributes)}`]
      };
    }
    // check organization viewer attributes
    if (R.prop('lagoon-organizations-viewer', currentUser.attributes)) {
      claims = {
        ...claims,
        userOrganizationsView: [`${R.prop('lagoon-organizations-viewer', currentUser.attributes)}`]
      };
    }
    if (R.prop('organization', attributes)) {
      const organizationId = parseInt(R.prop('organization', attributes), 10);
      claims = {
        ...claims,
        organizationQuery: [`${organizationId}`]
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
          groupRoleProjectIds = await UserModel.getAllProjectsIdsForUser(currentUser.id, keycloakUsersGroups);

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
      const newGrant = await keycloakGrantManager.checkPermissions(
        authzRequest,
        request
      );

      if (newGrant.access_token.hasPermission(resource, scope)) {
        return;
      }
    } catch (err) {
      // Keycloak library doesn't distinguish between a request error or access
      // denied conditions.
      userActivityLogger.user_info(
        `User does not have permission to '${scope}' on '${resource}'`,
        {
          user: currentUser.id,
          attributes: attributes
        }
      );
    }

    userActivityLogger.user_info(
      `User does not have permission to '${scope}' on '${resource}'`,
      {
        user: grant.access_token.content,
        attributes: attributes
      }
    );
    throw new KeycloakUnauthorizedError(
      `Unauthorized: You don't have permission to "${scope}" on "${resource}"`
    );
  };
};
