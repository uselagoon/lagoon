// @ts-ignore
import * as R from 'ramda';
import pickNonNil from '../util/pickNonNil';
import { logger } from '../loggers/logger';
// @ts-ignore
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';
import { Group, isRoleSubgroup } from './group';
import { sqlClientPool } from '../clients/sqlClient';
import { query } from '../util/db';
import { Sql } from '../resources/user/sql';
import { getConfigFromEnv } from '../util/config';
import { getRedisKeycloakCache } from '../clients/redisClient';

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
  owner?: boolean;
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
  getAllGroupsForUser: (userId: string) => Promise<Group[]>;
  getAllProjectsIdsForUser: (userInput: User, groups?: Group[]) => Promise<{}>;
  getUserRolesForProject: (
    userInput: User,
    projectId: number,
    userGroups: Group[]
  ) => Promise<string[]>;
  addUser: (userInput: User, resetPassword?: Boolean) => Promise<User>;
  updateUser: (userInput: UserEdit) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  resetUserPassword: (id: string) => Promise<void>;
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
const lagoonOrganizationsViewerLens = R.lensPath(['lagoon-organizations-viewer']);

const attrLagoonProjectsLens = R.compose(
  // @ts-ignore
  attrLens,
  lagoonOrganizationsLens,
  lagoonOrganizationsViewerLens,
  R.lensPath([0])
);

const attrLagoonOrgOwnerLens = R.compose(
  // @ts-ignore
  attrLens,
  lagoonOrganizationsLens,
  R.lensPath([0])
);

const attrLagoonOrgViewerLens = R.compose(
  // @ts-ignore
  attrLens,
  lagoonOrganizationsViewerLens,
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
  const { keycloakAdminClient } = clients;

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
          R.pick(['id', 'email', 'username', 'firstName', 'lastName', 'attributes', 'owner']),
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

  // used to list onwers of organizations
  const loadUsersByOrganizationId = async (organizationId: number): Promise<User[]> => {
    const ownerFilter = attribute => {
      if (attribute.name === 'lagoon-organizations') {
        const value = R.is(Array, attribute.value)
          ? R.path(['value', 0], attribute)
          : attribute.value;
        return R.test(new RegExp(`\\b${organizationId}\\b`), value);
      }

      return false;
    };
    const viewerFilter = attribute => {
      if (attribute.name === 'lagoon-organizations-viewer') {
        const value = R.is(Array, attribute.value)
          ? R.path(['value', 0], attribute)
          : attribute.value;
        return R.test(new RegExp(`\\b${organizationId}\\b`), value);
      }

      return false;
    };

    const keycloakUsers = await keycloakAdminClient.users.find({briefRepresentation: false, max: -1});

    let filteredOwners = filterUsersByAttribute(keycloakUsers, ownerFilter);
    let filteredViewers = filterUsersByAttribute(keycloakUsers, viewerFilter);
    for (const f1 in filteredOwners) {
      filteredOwners[f1].owner = true
    }
    const orgUsers = [...filteredOwners, ...filteredViewers]

    const users = await transformKeycloakUsers(orgUsers);

    return users;
  };

  const loadAllUsers = async (): Promise<User[]> => {
    const keycloakUsers = await keycloakAdminClient.users.find({
      max: -1
    });

    const users = await transformKeycloakUsers(keycloakUsers);

    return users;
  };

  const getAllGroupsForUser = async (userId: string, organization?: number): Promise<Group[]> => {
    const GroupModel = Group(clients);
    let groups = [];

    const roleSubgroups = await keycloakAdminClient.users.listGroups({
      id: userId,
      briefRepresentation: false
    });

    let fullGroups = [];
    try {
      // check redis for the allgroups cache value
      const data = await getRedisKeycloakCache("allgroups");
      let buff = new Buffer(data, 'base64');
      fullGroups = JSON.parse(buff.toString('utf-8'));
    } catch (err) {
      logger.warn(`Couldn't check redis keycloak cache: ${err.message}`);
      // if it can't be recalled from redis, get the data from keycloak
      const allGroups = await GroupModel.loadAllGroups();
      fullGroups = await GroupModel.transformKeycloakGroups(allGroups);
    }

    const regexp = /-(owner|maintainer|developer|reporter|guest)$/g;

    for (const fullGroup of fullGroups) {
      for (const roleSubgroup of roleSubgroups) {
        for (const fullSubgroup of fullGroup.subGroups) {
          if (roleSubgroup.name.replace(regexp, "") == fullSubgroup.name) {
            let group = fullSubgroup
            if (organization) {
              if (group.attributes["lagoon-organization"] != organization) {
                continue
              }
            }
            let filtergroup = group.subGroups.filter((item) => item.name == roleSubgroup.name);
            group.subGroups = filtergroup
            groups.push(group)
          }
        }
        if (roleSubgroup.name.replace(regexp, "") == fullGroup.name) {
          let group = fullGroup
          if (organization) {
            if (group.attributes["lagoon-organization"] != organization) {
              continue
            }
          }
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

  const addUser = async (userInput: User, resetPassword?: Boolean): Promise<User> => {
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

    if (resetPassword) {
      await keycloakAdminClient.users.executeActionsEmail({
        id: user.id,
        lifespan: 43200,
        actions: ["UPDATE_PASSWORD"],
        clientId: "lagoon-ui",
        redirectUri: getConfigFromEnv('UI_URL', "http://localhost:8888")
      });
    }

    return {
      ...user,
      gitlabId: R.prop('gitlabId', userInput)
    };
  };

  const removeOrgFromAttr = (attr, organization, user) => {
    return R.pipe(
      // @ts-ignore
      R.view(attr),
      R.defaultTo(`${organization}`),
      R.split(','),
      R.without(`${organization}`),
      R.uniq,
      R.join(',')
      // @ts-ignore
    )(user);
  }

  const addOrgToAttr = (attr, organization, user) => {
    return R.pipe(
      // @ts-ignore
      R.view(attr),
      R.defaultTo(`${organization}`),
      R.split(','),
      R.append(`${organization}`),
      R.uniq,
      R.join(',')
      // @ts-ignore
    )(user);
  }

  const resetUserPassword = async (id: string): Promise<void> => {
    try {
      await keycloakAdminClient.users.executeActionsEmail({
        id: id,
        lifespan: 43200,
        actions: ["UPDATE_PASSWORD"],
        clientId: "lagoon-ui",
        redirectUri: getConfigFromEnv('UI_URL', "http://localhost:8888")
      });
    } catch (err) {
      if (err.response.status && err.response.status === 404) {
        throw new UserNotFoundError(`User not found: ${id}`);
      } else {
        throw new Error(`Error updating Keycloak user: ${err.message}`);
      }
    }
  };

  const updateUser = async (userInput: UserEdit): Promise<User> => {
    // comments used to be removed when updating a user, now they aren't
    let organizations = null;
    let organizationsView = null;
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
        // owner is an option, default is view
        if (R.prop('remove', userInput)) {
          organizations = {'lagoon-organizations': [removeOrgFromAttr(attrLagoonOrgOwnerLens, R.prop('organization', userInput), user)]}
          organizationsView = {'lagoon-organizations-viewer': [removeOrgFromAttr(attrLagoonOrgViewerLens, R.prop('organization', userInput), user)]}
        } else {
          if (R.prop('owner', userInput)) {
            organizations = {'lagoon-organizations': [addOrgToAttr(attrLagoonOrgOwnerLens, R.prop('organization', userInput), user)]}
            organizationsView = {'lagoon-organizations-viewer': [removeOrgFromAttr(attrLagoonOrgViewerLens, R.prop('organization', userInput), user)]}
          } else {
            organizations = {'lagoon-organizations': [removeOrgFromAttr(attrLagoonOrgOwnerLens, R.prop('organization', userInput), user)]}
            organizationsView = {'lagoon-organizations-viewer': [addOrgToAttr(attrLagoonOrgViewerLens, R.prop('organization', userInput), user)]}
          }
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
            ...organizationsView,
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

  const getAllOrganizationIdsForUser = async (
    userInput: User
  ): Promise<number[]> => {
    let organizations = [];

    const user = await loadUserById(userInput.id);
    const usersOrgs = R.defaultTo('', R.prop('lagoon-organizations',  user.attributes)).toString()
    const usersOrgsViewer = R.defaultTo('', R.prop('lagoon-organizations-viewer',  user.attributes)).toString()

    if (usersOrgs != "" ) {
      const usersOrgsArr = usersOrgs.split(',');
      for (const userOrg of usersOrgsArr) {
        organizations = [...organizations, userOrg]
      }
    }
    if (usersOrgsViewer != "" ) {
      const usersOrgsArr = usersOrgsViewer.split(',');
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
    deleteUser,
    resetUserPassword
  };
};
