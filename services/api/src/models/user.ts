// @ts-ignore
import * as R from 'ramda';
import pickNonNil from '../util/pickNonNil';
import { logger } from '../loggers/logger';
// @ts-ignore
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';
import { Group, isRoleSubgroup } from './group';

interface IUserAttributes {
  comment?: [string];
  [propName: string]: any;
}
export interface User {
  email: string;
  username: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  comment?: string;
  gitlabId?: string;
  attributes?: IUserAttributes;
}

interface UserEdit {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  comment?: string;
  gitlabId?: string;
}

interface UserModel {
  loadAllUsers: () => Promise<User[]>;
  loadUserById: (id: string) => Promise<User>;
  loadUserByUsername: (username: string) => Promise<User>;
  loadUserByIdOrUsername: (userInput: UserEdit) => Promise<User>;
  loadUsersByOrganizationId: (organizationId: number) => Promise<User[]>;
  getAllOrganizationIdsForUser: (userInput: User) => Promise<number[]>;
  getAllGroupsForUser: (userInput: User) => Promise<Group[]>;
  getAllProjectsIdsForUser: (userInput: User) => Promise<number[]>;
  getUserRolesForProject: (
    userInput: User,
    projectId: number
  ) => Promise<string[]>;
  addUser: (userInput: User) => Promise<User>;
  updateUser: (userInput: UserEdit) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
}

interface AttributeFilterFn {
  (attribute: { name: string; value: string[] }): boolean;
}

export class UsernameExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsernameExistsError';
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

const attrLens = R.lensPath(['attributes']);
const commentLens = R.lensPath(['comment']);

const lagoonOrganizationsLens = R.lensPath(['lagoon-organizations']);

const attrLagoonProjectsLens = R.compose(
  // @ts-ignore
  attrLens,
  lagoonOrganizationsLens,
  R.lensPath([0])
);

const attrCommentLens = R.compose(
  // @ts-ignore
  attrLens,
  commentLens,
  R.lensPath([0])
);

export const User = (clients: {
  keycloakAdminClient: any;
  redisClient: any;
  sqlClientPool: any;
  esClient: any;
}): UserModel => {
  const { keycloakAdminClient, redisClient } = clients;

  // filter for user attributes like `lagoon-organizations`
  const filterUsersByAttribute = (
    users: User[],
    filterFn: AttributeFilterFn
  ): User[] =>
    R.filter((user: User) =>
      R.pipe(
        R.toPairs,
        R.reduce((isMatch: boolean, attribute: [string, string[]]): boolean => {
          if (!isMatch) {
            return filterFn({
              name: attribute[0],
              value: attribute[1]
            });
          }

          return isMatch;
        }, false)
      )(user.attributes)
    )(users);

  const fetchGitlabId = async (user: User): Promise<string> => {
    const identities = await keycloakAdminClient.users.listFederatedIdentities({
      id: user.id
    });

    const gitlabIdentity = R.find(
      R.propEq('identityProvider', 'gitlab'),
      identities
    );

    // @ts-ignore
    return R.defaultTo('', R.prop('userId', gitlabIdentity));
  };

  const transformKeycloakUsers = async (
    keycloakUsers: UserRepresentation[]
  ): Promise<User[]> => {
    // Map from keycloak object to user object
    const users = keycloakUsers.map(
      (keycloakUser: UserRepresentation): User =>
        // @ts-ignore
        R.pipe(
          R.pick(['id', 'email', 'username', 'firstName', 'lastName', 'attributes']),
          // @ts-ignore
          R.set(commentLens, R.view(attrCommentLens, keycloakUser))
        )(keycloakUser)
    );

    let usersWithGitlabIdFetch = [];

    for (const user of users) {
      usersWithGitlabIdFetch.push({
        ...user,
        gitlabId: await fetchGitlabId(user)
      });
    }

    return usersWithGitlabIdFetch;
  };

  const linkUserToGitlab = async (
    user: User,
    gitlabUserId: string
  ): Promise<void> => {
    try {
      // Add Gitlab Federated Identity to User
      await keycloakAdminClient.users.addToFederatedIdentity({
        id: user.id,
        federatedIdentityId: 'gitlab',
        federatedIdentity: {
          identityProvider: 'gitlab',
          userId: gitlabUserId,
          userName: gitlabUserId // we don't map the username, instead just use the UID again
        }
      });
    } catch (err) {
      throw new Error(
        `Error linking user "${user.email}" to Gitlab Federated Identity: ${err}`
      );
    }
  };

  const unlinkUserFromGitlab = async (user: User): Promise<void> => {
    try {
      // Remove Gitlab Federated Identity from User
      await keycloakAdminClient.users.delFromFederatedIdentity({
        id: user.id,
        federatedIdentityId: 'gitlab'
      });
    } catch (err) {
      if (err.response.status && err.response.status === 404) {
        // No-op
      } else {
        throw new Error(
          `Error unlinking user "${user.email}" from Gitlab Federated Identity: ${err}`
        );
      }
    }
  };

  const loadUserById = async (id: string): Promise<User> => {
    const keycloakUser = await keycloakAdminClient.users.findOne({
      id
    });

    if (R.isNil(keycloakUser)) {
      throw new UserNotFoundError(`User not found: ${id}`);
    }

    const users = await transformKeycloakUsers([keycloakUser]);

    return users[0];
  };

  const loadUserByUsername = async (username: string): Promise<User> => {
    const keycloakUsers = await keycloakAdminClient.users.find({
      username
    });

    if (R.isEmpty(keycloakUsers)) {
      throw new UserNotFoundError(`User not found: ${username}`);
    }

    const userId = R.pipe(
      R.filter(R.propEq('username', username)),
      R.path(['0', 'id'])
    )(keycloakUsers);

    if (R.isNil(userId)) {
      throw new UserNotFoundError(`User not found: ${username}`);
    }

    // @ts-ignore
    return await loadUserById(userId);
  };

  const loadUserByIdOrUsername = async (userInput: UserEdit): Promise<User> => {
    if (R.prop('id', userInput)) {
      return loadUserById(R.prop('id', userInput));
    }

    if (R.prop('username', userInput)) {
      return loadUserByUsername(R.prop('username', userInput));
    }

    throw new Error('You must provide a user id or username');
  };

  // used to list onwers of organizations
  const loadUsersByOrganizationId = async (organizationId: number): Promise<User[]> => {
    const filterFn = attribute => {
      if (attribute.name === 'lagoon-organizations') {
        const value = R.is(Array, attribute.value)
          ? R.path(['value', 0], attribute)
          : attribute.value;
        return R.test(new RegExp(`\\b${organizationId}\\b`), value);
      }

      return false;
    };

    let userIds = [];

    // This function is called often and is expensive to compute so prefer
    // performance over DRY
    try {
      userIds = await redisClient.getUsersOrganizationCache(organizationId);
    } catch (err) {
      logger.warn(`Error loading organization users from cache: ${err.message}`);
      userIds = [];
    }

    if (R.isEmpty(userIds)) {
      const keycloakUsers = await keycloakAdminClient.users.find();
      // @ts-ignore
      userIds = R.pluck('id', keycloakUsers);
    }

    let fullUsers = [];
    for (const id of userIds) {
      const fullUser = await keycloakAdminClient.users.findOne({
        id
      });

      fullUsers = [...fullUsers, fullUser];
    }

    const filteredUsers = filterUsersByAttribute(fullUsers, filterFn);
    try {
      const filteredUsersIds = R.pluck('id', filteredUsers);
      await redisClient.saveUsersOrganizationCache(organizationId, filteredUsersIds);
    } catch (err) {
      logger.warn(`Error saving organization users to cache: ${err.message}`);
    }

    const users = await transformKeycloakUsers(filteredUsers);

    return users;
  };

  const loadAllUsers = async (): Promise<User[]> => {
    const keycloakUsers = await keycloakAdminClient.users.find({
      max: -1
    });

    const users = await transformKeycloakUsers(keycloakUsers);

    return users;
  };

  const getAllGroupsForUser = async (userInput: User): Promise<Group[]> => {
    const GroupModel = Group(clients);
    let groups = [];

    const roleSubgroups = await keycloakAdminClient.users.listGroups({
      id: userInput.id
    });

    for (const roleSubgroup of roleSubgroups) {
      const fullRoleSubgroup = await GroupModel.loadGroupById(roleSubgroup.id);
      if (!isRoleSubgroup(fullRoleSubgroup)) {
        continue;
      }

      const roleSubgroupParent = await GroupModel.loadParentGroup(
        fullRoleSubgroup
      );

      groups.push(roleSubgroupParent);
    }

    return groups;
  };

  const getAllProjectsIdsForUser = async (
    userInput: User
  ): Promise<number[]> => {
    const GroupModel = Group(clients);
    let projects = [];

    const userGroups = await getAllGroupsForUser(userInput);

    for (const group of userGroups) {
      const projectIds = await GroupModel.getProjectsFromGroupAndSubgroups(
        group
      );
      projects = [...projects, ...projectIds];
    }

    return R.uniq(projects);
  };

  const getUserRolesForProject = async (
    userInput: User,
    projectId: number
  ): Promise<string[]> => {
    const GroupModel = Group(clients);

    const userGroups = await getAllGroupsForUser(userInput);

    let roles = [];
    for (const group of userGroups) {
      const projectIds = await GroupModel.getProjectsFromGroupAndSubgroups(
        group
      );

      if (projectIds.includes(projectId)) {
        const groupRoles = R.pipe(
          R.filter(membership =>
            R.pathEq(['user', 'id'], userInput.id, membership)
          ),
          R.pluck('role')
        )(group.members);

        roles = [...roles, ...groupRoles];
      }
    }

    return R.uniq(roles);
  };

  const addUser = async (userInput: User): Promise<User> => {
    let response: { id: string };
    try {
      response = await keycloakAdminClient.users.create({
        ...pickNonNil(
          ['email', 'username', 'firstName', 'lastName'],
          userInput
        ),
        enabled: true,
        attributes: {
          comment: [R.defaultTo('', R.prop('comment', userInput))]
        }
      });
    } catch (err) {
      if (err.response.status && err.response.status === 409) {
        throw new UsernameExistsError(
          `Username ${R.prop('username', userInput)} exists`
        );
      } else {
        throw new Error(`Error creating Keycloak user: ${err.message}`);
      }
    }

    const user = await loadUserById(response.id);

    // If user has been created with a gitlabid, we map that ID to the user in Keycloak
    if (R.prop('gitlabId', userInput)) {
      await linkUserToGitlab(user, R.prop('gitlabId', userInput));
    }

    return {
      ...user,
      gitlabId: R.prop('gitlabId', userInput)
    };
  };

  const updateUser = async (userInput: UserEdit): Promise<User> => {
    // comments used to be removed when updating a user, now they aren't
    let organizations = null;
    let comment = null;
    // update a users organization if required, hooks into the existing update user function, but is used by the addusertoorganization resolver
    try {
      // collect users existing attributes
      const user = await loadUserById(userInput.id);
      // set the comment if provided
      if (R.prop('comment', userInput)) {
        comment = {comment: R.prop('comment', userInput)}
      }
      // set the organization if provided
      if (R.prop('organization', userInput)) {
        const newOrganizations = R.pipe(
          // @ts-ignore
          R.view(attrLagoonProjectsLens),
          R.defaultTo(`${R.prop('organization', userInput)}`),
          R.split(','),
          R.append(`${R.prop('organization', userInput)}`),
          R.uniq,
          R.join(',')
        )(user);
        organizations = {'lagoon-organizations': [newOrganizations]}
        try {
          // when adding a user to organizations, if this is an organization based user, purge the cache so the users are updated
          // in the api
          await redisClient.deleteUsersOrganizationCache(R.prop('organization', userInput));
        } catch (err) {
          logger.warn(`Error deleting organization groups cache: ${err.message}`);
        }
      }

      await keycloakAdminClient.users.update(
        {
          id: userInput.id
        },
        {
          ...pickNonNil(
            ['email', 'username', 'firstName', 'lastName'],
            userInput
          ),
          attributes: {
            ...user.attributes,
            ...organizations,
            ...comment
          }
        }
      );
    } catch (err) {
      if (err.response.status && err.response.status === 404) {
        throw new UserNotFoundError(`User not found: ${userInput.id}`);
      } else {
        throw new Error(`Error updating Keycloak user: ${err.message}`);
      }
    }

    const user = await loadUserById(userInput.id);

    // If gitlabId was passed, assume it's changed
    if (R.prop('gitlabId', userInput)) {
      await unlinkUserFromGitlab(user);
      await linkUserToGitlab(user, R.prop('gitlabId', userInput));
    }

    return {
      ...user,
      gitlabId: R.prop('gitlabId', userInput)
    };
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      await keycloakAdminClient.users.del({ id });
    } catch (err) {
      if (err.response.status && err.response.status === 404) {
        throw new UserNotFoundError(`User not found: ${id}`);
      } else {
        throw new Error(`Error deleting user ${id}: ${err}`);
      }
    }
    try {
      await redisClient.deleteRedisUserCache(id);
    } catch (err) {
      logger.error(`Error deleting user cache ${id}: ${err}`);
    }
  };

  const getAllOrganizationIdsForUser = async (
    userInput: User
  ): Promise<number[]> => {
    const GroupModel = Group(clients);
    let organizations = [];

    const usersOrgs = userInput.attributes['lagoon-organizations'].toString()
    if (usersOrgs != "" ) {
      const usersOrgsArr = usersOrgs.split(',');
      for (const userOrg of usersOrgsArr) {
        organizations = [...organizations, userOrg]
      }
    }
    return R.uniq(organizations);
  };

  return {
    loadAllUsers,
    loadUserById,
    loadUserByUsername,
    loadUserByIdOrUsername,
    loadUsersByOrganizationId,
    getAllOrganizationIdsForUser,
    getAllGroupsForUser,
    getAllProjectsIdsForUser,
    getUserRolesForProject,
    addUser,
    updateUser,
    deleteUser
  };
};
