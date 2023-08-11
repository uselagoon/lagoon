import * as R from 'ramda';
import pickNonNil from '../util/pickNonNil';
import { logger } from '../loggers/logger';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';
import { Group, isRoleSubgroup } from './group';
import { sqlClientPool } from '../clients/sqlClient';
import { query } from '../util/db';
import { Sql } from '../resources/user/sql';

export interface User {
  email: string;
  username: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  comment?: string;
  gitlabId?: string;
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
  getAllGroupsForUser: (userId: string) => Promise<Group[]>;
  getAllProjectsIdsForUser: (userInput: User, groups?: Group[]) => Promise<{}>;
  getUserRolesForProject: (
    userInput: User,
    projectId: number,
    userGroups: Group[]
  ) => Promise<string[]>;
  addUser: (userInput: User) => Promise<User>;
  updateUser: (userInput: UserEdit) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  transformKeycloakUsers: (keycloakUsers: UserRepresentation[]) => Promise<User[]>;
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
  const { keycloakAdminClient } = clients;

  const fetchGitlabId = async (user: User): Promise<string> => {
    const identities = await keycloakAdminClient.users.listFederatedIdentities({
      id: user.id
    });

    const gitlabIdentity = R.find(
      R.propEq('identityProvider', 'gitlab'),
      identities
    );

    // @ts-ignore
    return R.defaultTo(undefined, R.prop('userId', gitlabIdentity));
  };

  const transformKeycloakUsers = async (
    keycloakUsers: UserRepresentation[]
  ): Promise<User[]> => {
    // Map from keycloak object to user object
    const users = keycloakUsers.map(
      (keycloakUser: UserRepresentation): User =>
        // @ts-ignore
        R.pipe(
          R.pick(['id', 'email', 'username', 'firstName', 'lastName']),
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
    let keycloakUser: User
    keycloakUser = await keycloakAdminClient.users.findOne({
      id
    });
    const users = await transformKeycloakUsers([keycloakUser]);
    keycloakUser = users[0]

    if (R.isNil(keycloakUser)) {
      throw new UserNotFoundError(`User not found a: ${id}`);
    }
    return keycloakUser;
  };

  // used by project resolver only, so leave this one out of redis for now
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

  const loadAllUsers = async (): Promise<User[]> => {
    const keycloakUsers = await keycloakAdminClient.users.find({
      max: -1
    });

    const users = await transformKeycloakUsers(keycloakUsers);

    return users;
  };

  const getAllGroupsForUser = async (userId: string): Promise<Group[]> => {
    const GroupModel = Group(clients);
    let groups = [];

    const roleSubgroups = await keycloakAdminClient.users.listGroups({
      id: userId,
      briefRepresentation: false
    });
    const fullGroups = await keycloakAdminClient.groups.find({briefRepresentation: false});

    const regexp = /-(owner|maintainer|developer|reporter|guest)$/g;

    for (const fullGroup of fullGroups) {
      for (const roleSubgroup of roleSubgroups) {
        for (const fullSubgroup of fullGroup.subGroups) {
          if (roleSubgroup.name.replace(regexp, "") == fullSubgroup.name) {
            let group = fullSubgroup
            let filtergroup = group.subGroups.filter((item) => item.name == roleSubgroup.name);
            group.subGroups = filtergroup
            groups.push(group)
          }
        }
        if (roleSubgroup.name.replace(regexp, "") == fullGroup.name) {
          let group = fullGroup
          let filtergroup = group.subGroups.filter((item) => item.name == roleSubgroup.name);
          group.subGroups = filtergroup
          groups.push(group)
        }
      }
    }

    const retGroups = await GroupModel.transformKeycloakGroups(groups);
    return retGroups;
  };

  const getAllProjectsIdsForUser = async (
    userInput: User,
    groups?: Group[]
  ): Promise<{}> => {
    const GroupModel = Group(clients);
    let roleProjectIds = {};

    if (groups) {
      // if groups are provided (eg, the groups have previously been calculated in a prior step), then process those groups here and extract the project ids from them
      for (const roleSubgroup of groups) {
        for (const fullSubgroup of roleSubgroup.subGroups) {
          // https://github.com/uselagoon/lagoon/pull/3358 references potential issue with the lagoon-projects attribute where there could be empty values
          // getProjectsFromGroupAndSubgroups already covers this fix
          const projectIds = await GroupModel.getProjectsFromGroupAndSubgroups(
            roleSubgroup
          );
          if (!roleProjectIds[fullSubgroup.realmRoles[0]]) {
            roleProjectIds[fullSubgroup.realmRoles[0]] = []
          }
          projectIds.forEach(pid => {
            roleProjectIds[fullSubgroup.realmRoles[0]].indexOf(pid) === -1 ? roleProjectIds[fullSubgroup.realmRoles[0]].push(pid) : ""
          })
        }
      }

      return roleProjectIds;
    } else {
      // otherwise fall back to the previous method of getting groups and project ids which is an expensive call to keycloak if repeated often
      const roleSubgroups = await keycloakAdminClient.users.listGroups({
        id: userInput.id,
        briefRepresentation: false
      });

      const fullGroups = await keycloakAdminClient.groups.find({briefRepresentation: false});

      // currently in lagoon groups with a role will have the role as a prefix, this regix can be used to identify and remove it to get the parent group name
      const regexp = /-(owner|maintainer|developer|reporter|guest)$/g;

      for (const fullGroup of fullGroups) {
        for (const roleSubgroup of roleSubgroups) {
          for (const fullSubgroup of fullGroup.subGroups) {
            if (roleSubgroup.name.replace(regexp, "") == fullSubgroup.name) {
              // https://github.com/uselagoon/lagoon/pull/3358 references potential issue with the lagoon-projects attribute where there could be empty values
              // getProjectsFromGroupAndSubgroups already covers this fix
              const projectIds = await GroupModel.getProjectsFromGroupAndSubgroups(
                fullSubgroup
              );
              if (!roleProjectIds[roleSubgroup.realmRoles[0]]) {
                roleProjectIds[roleSubgroup.realmRoles[0]] = []
              }
              projectIds.forEach(pid => {
                roleProjectIds[roleSubgroup.realmRoles[0]].indexOf(pid) === -1 ? roleProjectIds[roleSubgroup.realmRoles[0]].push(pid) : ""
              })
            }
          }
          if (roleSubgroup.name.replace(regexp, "") == fullGroup.name) {
            // https://github.com/uselagoon/lagoon/pull/3358 references potential issue with the lagoon-projects attribute where there could be empty values
            // getProjectsFromGroupAndSubgroups already covers this fix
            const projectIds = await GroupModel.getProjectsFromGroupAndSubgroups(
              fullGroup
            );
            if (!roleProjectIds[roleSubgroup.realmRoles[0]]) {
              roleProjectIds[roleSubgroup.realmRoles[0]] = []
            }
            projectIds.forEach(pid => {
              roleProjectIds[roleSubgroup.realmRoles[0]].indexOf(pid) === -1 ? roleProjectIds[roleSubgroup.realmRoles[0]].push(pid) : ""
            })
          }
        }
      }

      return roleProjectIds;
    }
  };

  const getUserRolesForProject = async (
    userInput: User,
    projectId: number,
    userGroups: Group[]
  ): Promise<string[]> => {
    const GroupModel = Group(clients);

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
    try {
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
            comment: [R.defaultTo('', R.prop('comment', userInput))]
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
      // delete the ssh keys of the user
      await query(
        sqlClientPool,
        Sql.deleteFromSshKeys(id)
      );
      // delete from the reference table
      await query(
        sqlClientPool,
        Sql.deleteFromUserSshKeys(id)
      );

      await keycloakAdminClient.users.del({ id });
    } catch (err) {
      if (err.response.status && err.response.status === 404) {
        throw new UserNotFoundError(`User not found: ${id}`);
      } else {
        throw new Error(`Error deleting user ${id}: ${err}`);
      }
    }
  };

  return {
    loadAllUsers,
    loadUserById,
    loadUserByUsername,
    loadUserByIdOrUsername,
    getAllGroupsForUser,
    getAllProjectsIdsForUser,
    getUserRolesForProject,
    addUser,
    updateUser,
    deleteUser,
    transformKeycloakUsers
  };
};
