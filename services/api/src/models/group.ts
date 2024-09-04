import * as R from 'ramda';
import { Pool } from 'mariadb';
import { asyncPipe } from '@lagoon/commons/dist/util/func';
import pickNonNil from '../util/pickNonNil';
import { logger } from '../loggers/logger';
import type { GroupRepresentation } from '@s3pweb/keycloak-admin-client-cjs';
import { User } from './user';
import { groupCacheExpiry, get, del, redisClient } from '../clients/redisClient';
import { Helpers as projectHelpers } from '../resources/project/helpers';
import { Helpers as groupHelpers } from '../resources/group/helpers';
import { sqlClientPool } from '../clients/sqlClient';

interface IGroupAttributes {
  'lagoon-projects'?: [string];
  'lagoon-organization'?: [string];
  comment?: [string];
  [propName: string]: any;
}

export interface Group {
  name: string;
  id?: string;
  type?: string;
  currency?: string;
  path?: string;
  parentGroupId?: string;
  organization?: number;
  // Only groups that aren't role subgroups.
  groups?: Group[];
  members?: GroupMembership[];
  // All subgroups according to keycloak.
  subGroups?: GroupRepresentation[];
  attributes?: IGroupAttributes;
  realmRoles?: any[];
}

interface GroupMembership {
  user: User;
  role: string;
  roleSubgroupId: string;
}

export interface GroupInput {
  id?: string;
  name?: string;
  organization?: number;
}

interface GroupEdit {
  id: string;
  name: string;
  attributes?: object;
}

interface AttributeFilterFn {
  (attribute: { name: string; value: string[] }): boolean;
}

export class GroupExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroupExistsError';
  }
}

export class GroupNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroupNotFoundError';
  }
}

const attrLens = R.lensPath(['attributes']);
const lagoonProjectsLens = R.lensPath(['lagoon-projects']);
const lagoonOrganizationLens = R.lensPath(['lagoon-organization']);

const attrLagoonProjectsLens = R.compose(
  // @ts-ignore
  attrLens,
  lagoonProjectsLens,
  R.lensPath([0])
);

const attrLagoonOrganizationLens = R.compose(
  // @ts-ignore
  attrLens,
  lagoonOrganizationLens,
  R.lensPath([0])
);

const getProjectIdsFromGroup = R.pipe(
  // @ts-ignore
  R.view(attrLagoonProjectsLens),
  R.defaultTo(''),
  R.split(','),
  R.reject(R.isEmpty),
  R.map(id => parseInt(id, 10))
);

const getOrganizationIdFromGroup = R.pipe(
  // @ts-ignore
  R.view(attrLagoonOrganizationLens),
  R.defaultTo(''),
  R.split(','),
  R.reject(R.isEmpty),
  R.map(id => parseInt(id, 10))
);

export const isRoleSubgroup = R.pathEq(
  ['attributes', 'type', 0],
  'role-subgroup'
);

const attributeKVOrNull = (key: string, group: GroupRepresentation) =>
  String(R.pathOr(null, ['attributes', key], group));

export const Group = (clients: {
  keycloakAdminClient: any;
  redisClient: any;
  sqlClientPool: Pool;
  esClient: any;
}) => {
  const { keycloakAdminClient } = clients;

  const transformKeycloakGroups = async (
    keycloakGroups: GroupRepresentation[]
  ): Promise<Group[]> => {
    // Map from keycloak object to group object
    const groups = keycloakGroups.map(
      (keycloakGroup: GroupRepresentation): Group => ({
        id: keycloakGroup.id,
        name: keycloakGroup.name,
        type: attributeKVOrNull('type', keycloakGroup),
        path: keycloakGroup.path,
        attributes: keycloakGroup.attributes,
        subGroups: keycloakGroup.subGroups,
        organization: parseInt(attributeKVOrNull('lagoon-organization', keycloakGroup), 10) || null, // if it exists set it or null
      })
    );

    let groupsWithGroupsAndMembers = [];

    for (const group of groups) {
      const subGroups = R.reject(isRoleSubgroup)(group.subGroups);
      groupsWithGroupsAndMembers.push({
        ...group,
        groups: R.isEmpty(subGroups)
          ? []
          : await transformKeycloakGroups(subGroups),
        // retrieving members is a heavy operation
        // this is now its own resolver
        // members: await getGroupMembership(group)
      });
    }

    return groupsWithGroupsAndMembers;
  };

  const loadGroupById = async (id: string): Promise<Group> => {
    let group;

    // check if the group is in the cache
    try {
      group = await getGroupCacheById(id)
    } catch(err) {
      logger.warn(`Error reading redis, falling back to direct lookup: ${err.message}`);
    }
    // if not in the cache, check keycloak
    if (!group) {
      let keycloakGroup: Group
      keycloakGroup = await keycloakAdminClient.groups.findOne({
        id,
        briefRepresentation: false,
      });
      if (R.isNil(keycloakGroup)) {
        throw new GroupNotFoundError(`Group not found: ${id}`);
      }

      const groups = await transformKeycloakGroups([keycloakGroup]);
      keycloakGroup = groups[0]
      // then save the entry in the cache
      try {
        await saveGroupCache(keycloakGroup)
      } catch (err) {
        logger.info (`Error saving redis: ${err.message}`)
      }
      return keycloakGroup;
    }
    return group;
  };

  const loadGroupByName = async (name: string): Promise<Group> => {
    let group;

    try {
      group = await getGroupCacheByName(name)
    } catch(err) {
      logger.warn(`Error reading redis, falling back to direct lookup: ${err.message}`);
    }

    if (!group) {
      const keycloakGroups = await keycloakAdminClient.groups.find({
        search: name
      });

      if (R.isEmpty(keycloakGroups)) {
        throw new GroupNotFoundError(`Group not found: ${name}`);
      }

      // Use mutable operations to avoid running out of heap memory
      const flattenGroups = (groups, group) => {
        groups.push(R.omit(['subGroups'], group));
        const flatSubGroups = group.subGroups.reduce(flattenGroups, []);
        return groups.concat(flatSubGroups);
      };

      group = R.pipe(
        R.reduce(flattenGroups, []),
        R.filter(R.propEq('name', name))
      )(keycloakGroups);

      if (R.isEmpty(group)) {
        throw new GroupNotFoundError(`Group not found: ${name}`);
      }

      const keycloakGroup = await keycloakAdminClient.groups.findOne({
        id: group[0].id,
        briefRepresentation: false,
      });
      const groups = await transformKeycloakGroups([keycloakGroup]);
      group = groups[0];
      try {
        await saveGroupCache(group)
      } catch (err) {
        logger.info (`Error saving redis: ${err.message}`)
      }
    }

    // @ts-ignore
    return group;
  };

  const loadGroupByIdOrName = async (
    groupInput: GroupInput
  ): Promise<Group> => {
    if (R.prop('id', groupInput)) {
      return loadGroupById(R.prop('id', groupInput));
    }

    if (R.prop('name', groupInput)) {
      return loadGroupByName(R.prop('name', groupInput));
    }

    throw new Error('You must provide a group id or name');
  };

  const loadAllGroups = async (): Promise<Group[]> => {
    // briefRepresentation pulls all the group information from keycloak including the attributes
    // this means we don't need to iterate over all the groups one by one anymore to get the full group information
    const fullGroups = await keycloakAdminClient.groups.find({briefRepresentation: false});
    // no need to transform, just return the full response, only the `allGroups` resolvers use this
    // and the `sync-groups-opendistro-security` consumption of this helper sync script is going to
    // go away in the future when we move to the `lagoon-opensearch-sync` supporting service
    return fullGroups;
  };

  const loadParentGroup = async (groupInput: Group): Promise<Group> =>
    asyncPipe(
      R.prop('path'),
      R.split('/'),
      R.nth(-2),
      R.cond([[R.isEmpty, R.always(null)], [R.T, loadGroupByName]])
    )(groupInput);

  const filterGroupsByAttribute = (
    groups: Group[],
    filterFn: AttributeFilterFn
  ): Group[] =>
    R.filter((group: Group) =>
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
      )(group.attributes)
    )(groups);

  const loadGroupsByAttribute = async (
    filterFn: AttributeFilterFn
  ): Promise<Group[]> => {
    const keycloakGroups = await keycloakAdminClient.groups.find({briefRepresentation: false});

    const filteredGroups = filterGroupsByAttribute(keycloakGroups, filterFn);

    return await transformKeycloakGroups(filteredGroups);
  };

  const loadGroupsByProjectId = async (projectId: number): Promise<Group[]> => {
    const filterFn = attribute => {
      if (attribute.name === 'lagoon-projects') {
        const value = R.is(Array, attribute.value)
          ? R.path(['value', 0], attribute)
          : attribute.value;
        return R.test(new RegExp(`\\b${projectId}\\b`), value);
      }

      return false;
    };

    // this request will be huge, but it is significantly faster than the alternative iteration that followed previously
    // briefRepresentation pulls all the group information from keycloak including the attributes
    // this means we don't need to iterate over all the groups one by one anymore to get the full group information
    const groups = await keycloakAdminClient.groups.find({briefRepresentation: false});

    const filteredGroups = filterGroupsByAttribute(groups, filterFn);

    const fullGroups = await transformKeycloakGroups(filteredGroups);

    return fullGroups;
  };


  // loadGroupsByProjectIdFromGroups does the same thing as loadGroupsByProjectId, except takes a groups input in the arguments
  // from another source that has already calculated the required groups
  const loadGroupsByProjectIdFromGroups = async (projectId: number, groups: Group[]): Promise<Group[]> => {
    const filterFn = attribute => {
      if (attribute.name === 'lagoon-projects') {
        const value = R.is(Array, attribute.value)
          ? R.path(['value', 0], attribute)
          : attribute.value;
        return R.test(new RegExp(`\\b${projectId}\\b`), value);
      }

      return false;
    };
    const filteredGroups = filterGroupsByAttribute(groups, filterFn);

    const fullGroups = await transformKeycloakGroups(filteredGroups);

    return fullGroups;
  };

  // used by organization resolver to list all groups attached to the organization
  const loadGroupsByOrganizationId = async (organizationId: number): Promise<Group[]> => {
    const filterFn = attribute => {
      if (attribute.name === 'lagoon-organization') {
        const value = R.is(Array, attribute.value)
          ? R.path(['value', 0], attribute)
          : attribute.value;
        return R.test(new RegExp(`\\b${organizationId}\\b`), value);
      }

      return false;
    };

    let groupIds = []
    const keycloakGroups = await keycloakAdminClient.groups.find();
    // @ts-ignore
    groupIds = R.pluck('id', keycloakGroups);

    let fullGroups = [];
    for (const id of groupIds) {
      const fullGroup = await keycloakAdminClient.groups.findOne({
        id
      });
      fullGroups = [...fullGroups, fullGroup];
    }

    try {
      const filteredGroups = filterGroupsByAttribute(fullGroups, filterFn);
      const groups = await transformKeycloakGroups(filteredGroups);
      return groups;
    } catch (err) {
      return null
    }

  };

  // used by organization resolver to list all groups attached to the organization
  const loadGroupsByOrganizationIdFromGroups = async (organizationId: number, groups: Group[]): Promise<Group[]> => {
    const filterFn = attribute => {
      if (attribute.name === 'lagoon-organization') {
        const value = R.is(Array, attribute.value)
          ? R.path(['value', 0], attribute)
          : attribute.value;
        return R.test(new RegExp(`\\b${organizationId}\\b`), value);
      }

      return false;
    };
    const filteredGroups = filterGroupsByAttribute(groups, filterFn);

    const fullGroups = await transformKeycloakGroups(filteredGroups);

    return fullGroups;
  };

  // Recursive function to load membership "up" the group chain
  const getMembersFromGroupAndParents = async (
    group: Group
  ): Promise<GroupMembership[]> => {
    const members = R.prop('members', group);

    const parentGroup = await loadParentGroup(group);
    const parentMembers = parentGroup
      ? await getMembersFromGroupAndParents(parentGroup)
      : [];

    return [...members, ...parentMembers];
  };

  // Recursive function to load projects "up" the group chain
  const getProjectsFromGroupAndParents = async (
    group: Group
  ): Promise<number[]> => {
    const projectIds = getProjectIdsFromGroup(group);

    const parentGroup = await loadParentGroup(group);
    const parentProjectIds = parentGroup
      ? await getProjectsFromGroupAndParents(parentGroup)
      : [];

    return [
      // @ts-ignore
      ...projectIds,
      ...parentProjectIds
    ];
  };

  // Recursive function to load projects "down" the group chain
  const getProjectsFromGroupAndSubgroups = async (
    group: Group
  ): Promise<number[]> => {
    try {
      const groupProjectIds = getProjectIdsFromGroup(group);

      let subGroupProjectIds = [];
      // @TODO: check is `groups.groups` ever used? it always appears to be empty
      if (group.groups) {
        for (const subGroup of group.groups) {
          const projectIds = await getProjectsFromGroupAndSubgroups(subGroup);
          subGroupProjectIds = [...subGroupProjectIds, ...projectIds];
        }
      }

      const projectIdsArray = [
        // @ts-ignore
        ...groupProjectIds,
        ...subGroupProjectIds
      ];
      // remove deleted projects from the result to prevent null errors in user queries
      const existingProjects = await projectHelpers(sqlClientPool).getAllProjectsIn(projectIdsArray);
      let existingProjectsIds = [];
      existingProjectsIds.push(...existingProjects.map(epi => epi.id));
      return projectIdsArray.filter(item => existingProjectsIds.some(existingProjectsIds => existingProjectsIds === item))
    } catch (err) {
      return [];
    }
  };

  // return only project ids that still exist in lagoon in the response for which projects this group has assigned
  // in the past some groups could have been deleted from lagoon and their `attribute` in keycloak remained
  const getProjectsFromGroup = async (
    group: Group
  ): Promise<number[]> => {
    try {
      const groupProjectIds = getProjectIdsFromGroup(group);
      // remove deleted projects from the result to prevent null errors in user queries
      const existingProjects = await projectHelpers(sqlClientPool).getAllProjectsIn(groupProjectIds);
      let existingProjectsIds = [];
      existingProjectsIds.push(...existingProjects.map(epi => epi.id));
      return existingProjectsIds
    } catch (err) {
      return [];
    }
  };

  const getGroupMembership = async (
    group: Group
  ): Promise<GroupMembership[]> => {
    const UserModel = User(clients);
    const roleSubgroups = group.subGroups.filter(isRoleSubgroup);
    let membership = [];
    // check for members cache
    const membersCacheKey = `cache:keycloak:group-members:${group.id}`;
    try {
      let data = await get(membersCacheKey);
      if (data) {
        let buff = Buffer.from(data, 'base64');
        // set membership to cached data
        membership = JSON.parse(buff.toString('utf-8'));
      }
    } catch(err) {
      logger.warn(`Error reading redis ${membersCacheKey}, falling back to direct lookup: ${err.message}`);
    }
    if (membership.length == 0) {
      for (const roleSubgroup of roleSubgroups) {
        const keycloakUsers = await keycloakAdminClient.groups.listMembers({
          id: roleSubgroup.id,
          briefRepresentation: false,
        });

        let members = [];
        for (const keycloakUser of keycloakUsers) {
          const users = await UserModel.transformKeycloakUsers([keycloakUser]);
          const fullUser = users[0]
          const member = {
            user: fullUser,
            role: roleSubgroup.realmRoles[0],
            roleSubgroupId: roleSubgroup.id
          };

          members = [...members, member];
        }

        membership = [...membership, ...members];
      }
      // save latest members cache
      const data = Buffer.from(JSON.stringify(membership)).toString('base64')
      try {
        await redisClient.multi()
        .set(membersCacheKey, data)
        .expire(membersCacheKey, groupCacheExpiry) // 48 hours
        .exec();
      } catch (err) {
        logger.info (`Error saving redis ${membersCacheKey}: ${err.message}`)
      }
    }

    return membership;
  };

  const getGroupMemberCount = async (
    group: Group
  ): Promise<number> => {
    const membership = await getGroupMembership(group)
    return membership.length;
  };

  const addGroup = async (groupInput: Group, projectId?: number, organizationId?: number): Promise<Group> => {
    // Don't allow duplicate subgroup names
    try {
      const existingGroup = await loadGroupByName(groupInput.name);
      throw new Error('group-with-name-exists');
    } catch (err) {
      if (err instanceof GroupNotFoundError) {
        // No group exists with this name already, continue
      } else if (err.message == 'group-with-name-exists') {
        throw new GroupExistsError(
          `Group ${R.prop('name', groupInput)} exists`
        );
      } else {
        throw err;
      }
    }

    let response: { id: string };
    try {
      // @ts-ignore
      response = await keycloakAdminClient.groups.create({
        ...pickNonNil(['id', 'name', 'attributes'], groupInput)
      });
    } catch (err) {
      if (err.response.status && err.response.status === 409) {
        throw new GroupExistsError(
          `Group ${R.prop('name', groupInput)} exists`
        );
      } else {
        throw new Error(`Error creating Keycloak group: ${err.message}`);
      }
    }

    const group = await loadGroupById(response.id);
    if (projectId) {
      await groupHelpers(sqlClientPool).addProjectToGroup(projectId, group.id)
    }
    if (organizationId) {
      await groupHelpers(sqlClientPool).addOrganizationToGroup(organizationId, group.id)
    }

    // Set the parent group
    if (R.prop('parentGroupId', groupInput)) {
      try {
        const parentGroup = await loadGroupById(
          R.prop('parentGroupId', groupInput)
        );

        await keycloakAdminClient.groups.setOrCreateChild(
          {
            id: parentGroup.id
          },
          {
            id: group.id,
            name: group.name
          }
        );
      } catch (err) {
        if (err instanceof GroupNotFoundError) {
          throw new GroupNotFoundError(
            `Parent group not found ${R.prop('parentGroupId', groupInput)}`
          );
        } else if (
          err.message.includes('location header is not found in request')
        ) {
          // This is a bug in the keycloak client, ignore
        } else {
          logger.error(`Could not set parent group: ${err.message}`);
        }
      }
    }

    return group;
  };

  const updateGroup = async (groupInput: GroupEdit): Promise<Group> => {
    const oldGroup = await loadGroupById(groupInput.id);

    try {
      await purgeGroupCache(oldGroup)
      await keycloakAdminClient.groups.update(
        {
          id: groupInput.id
        },
        //@ts-ignore
        {
          ...pickNonNil(['name', 'attributes'], groupInput)
        }
      );
    } catch (err) {
      if (err.response.status && err.response.status === 409) {
        throw new GroupExistsError(
          `Group ${R.prop('name', groupInput)} exists`
        );
      } else if (err.response.status && err.response.status === 404) {
        throw new GroupNotFoundError(`Group not found: ${groupInput.id}`);
      } else {
        throw new Error(`Error updating Keycloak group: ${err.message}`);
      }
    }

    let newGroup = await loadGroupById(groupInput.id);

    if (oldGroup.name != newGroup.name) {
      const roleSubgroups = newGroup.subGroups.filter(isRoleSubgroup);

      for (const roleSubgroup of roleSubgroups) {
        await updateGroup({
          id: roleSubgroup.id,
          name: R.replace(oldGroup.name, newGroup.name, roleSubgroup.name)
        });
      }
    }
    return newGroup;
  };

  const deleteGroup = async (id: string): Promise<void> => {
    try {
      const keycloakGroup = await keycloakAdminClient.groups.findOne({
        id,
        briefRepresentation: false,
      });
      await groupHelpers(sqlClientPool).deleteGroup(id)
      await purgeGroupCache(keycloakGroup)
      await keycloakAdminClient.groups.del({ id });
    } catch (err) {
      if (err.response.status && err.response.status === 404) {
        throw new GroupNotFoundError(`Group not found: ${id}`);
      } else {
        throw new Error(`Error deleting group ${id}: ${err}`);
      }
    }
  };

  const addUserToGroup = async (
    user: User,
    groupInput: Group,
    roleName: string
  ): Promise<Group> => {
    const group = await loadGroupById(groupInput.id);
    // Load or create the role subgroup.
    let roleSubgroup: Group;
    // @ts-ignore
    roleSubgroup = R.find(R.propEq('name', `${group.name}-${roleName}`))(
      group.subGroups
    );
    if (!roleSubgroup) {
      roleSubgroup = await addGroup({
        name: `${group.name}-${roleName}`,
        parentGroupId: group.id,
        attributes: {
          type: ['role-subgroup']
        }
      });
      const role = await keycloakAdminClient.roles.findOneByName({
        name: roleName
      });
      await keycloakAdminClient.groups.addRealmRoleMappings({
        id: roleSubgroup.id,
        roles: [{ id: role.id, name: role.name }]
      });
    }

    // Add the user to the role subgroup.
    try {
      await keycloakAdminClient.users.addToGroup({
        id: user.id,
        groupId: roleSubgroup.id
      });
    } catch (err) {
      throw new Error(`Could not add user to group: ${err.message}`);
    }
    await purgeGroupCache(group)
    return await loadGroupById(group.id);
  };

  const removeUserFromGroup = async (
    user: User,
    group: Group
  ): Promise<Group> => {
    // purge the caches to ensure current data
    await purgeGroupCache(group, true)
    const members = await getGroupMembership(group);
    const userMembership = R.find(R.pathEq(['user', 'id'], user.id))(members);

    if (userMembership) {
      // Remove user from the role subgroup.
      try {
        await keycloakAdminClient.users.delFromGroup({
          // @ts-ignore
          id: userMembership.user.id,
          // @ts-ignore
          groupId: userMembership.roleSubgroupId
        });
      } catch (err) {
        throw new Error(`Could not remove user from group: ${err.message}`);
      }
      // purge after removing the user to ensure current data
      await purgeGroupCache(group)
    }
    return await loadGroupById(group.id);
  };

  const addProjectToGroup = async (
    projectId: number,
    groupInput: any
  ): Promise<void> => {
    const group = await loadGroupById(groupInput.id);
    let newGroupProjects = ""
    if (projectId) {
      const groupProjectIds = getProjectIdsFromGroup(group)
      newGroupProjects = R.pipe(
        R.append(projectId),
        R.uniq,
        R.join(',')
        // @ts-ignore
      )(groupProjectIds);
    }

    try {
      await groupHelpers(sqlClientPool).addProjectToGroup(projectId, group.id)
      await keycloakAdminClient.groups.update(
        {
          id: group.id
        },
        {
          name: group.name,
          attributes: {
            ...group.attributes,
            'lagoon-projects': [newGroupProjects],
            'group-lagoon-project-ids': [`{${JSON.stringify(group.name)}:[${newGroupProjects}]}`]
          }
        }
      );
      // purge the caches to ensure current data
      await purgeGroupCache(group)
    } catch (err) {
      throw new Error(
        `Error setting projects for group ${group.name}: ${err.message}`
      );
    }
  };

  const removeProjectFromGroup = async (
    projectId: number,
    group: Group
  ): Promise<void> => {
    const groupProjectIds = getProjectIdsFromGroup(group)
    const newGroupProjects = R.pipe(
      R.without([projectId]),
      R.uniq,
      R.join(',')
      // @ts-ignore
    )(groupProjectIds);

    try {
      await groupHelpers(sqlClientPool).removeProjectFromGroup(projectId, group.id)
      await keycloakAdminClient.groups.update(
        {
          id: group.id
        },
        {
          name: group.name,
          attributes: {
            ...group.attributes,
            'lagoon-projects': [newGroupProjects],
            'group-lagoon-project-ids': [`{${JSON.stringify(group.name)}:[${newGroupProjects}]}`]
          }
        }
      );
      // purge the caches to ensure current data
      await purgeGroupCache(group)
    } catch (err) {
      throw new Error(
        `Error setting projects for group ${group.name}: ${err.message}`
      );
    }
  };

  // helper to remove project from groups
  const removeProjectFromGroups = async (
    projectId: number,
    groups: Group[]
  ): Promise<void> => {
    for (const g in groups) {
      try {
        await removeProjectFromGroup(projectId, groups[g])
      } catch (err) {
        throw new Error(
          `Error setting projects for group ${groups[g].name}: ${err.message}`
        );
      }
    }
  };

  // helper to remove user from groups
  const removeUserFromGroups = async (
    user: User,
    groups: Group[]
  ): Promise<void> => {
    for (const g in groups) {
      const group = groups[g]
      // purge the caches to ensure current data
      await purgeGroupCache(group, true)
      const members = await getGroupMembership(group);
      const userMembership = R.find(R.pathEq(['user', 'id'], user.id))(members);

      if (userMembership) {
        try {
          await keycloakAdminClient.users.delFromGroup({
            // @ts-ignore
            id: userMembership.user.id,
            // @ts-ignore
            groupId: userMembership.roleSubgroupId
          });
        } catch (err) {
          throw new Error(`Could not remove user from group: ${err.message}`);
        }
      }
      // purge the caches to ensure current data
      await purgeGroupCache(group)
    }
  };

  // helper to remove all non default-users from project
  const removeNonProjectDefaultUsersFromGroup = async (
    group: Group,
    project: String,
  ): Promise<Group> => {
    // purge the caches to ensure current data
    await purgeGroupCache(group, true)
    const members = await getGroupMembership(group);

    for (const u in members) {
      if (members[u].user.email != "default-user@"+project) {
        try {
          await keycloakAdminClient.users.delFromGroup({
            // @ts-ignore
            id: members[u].user.id,
            // @ts-ignore
            groupId: members[u].roleSubgroupId
          });
        } catch (err) {
          throw new Error(`Could not remove user from group: ${err.message}`);
        }
      }
    }
    // purge the caches to ensure current data
    await purgeGroupCache(group)
    return await loadGroupById(group.id);
  };

  const purgeGroupCache = async (group: Group, membersOnly: Boolean=false): Promise<void> => {
    if (!membersOnly) {
      await del(`cache:keycloak:group-id:${group.name}`);
      await del(`cache:keycloak:group:${group.id}`);
    }
    await del(`cache:keycloak:group-members:${group.id}`);
  };

  const saveGroupCache = async (group: Group): Promise<void> => {
    const idCacheKey = `cache:keycloak:group:${group.id}`;
    const nameCacheKey = `cache:keycloak:group-id:${group.name}`;
    const data = Buffer.from(JSON.stringify(group)).toString('base64')
    await redisClient.multi()
      .set(nameCacheKey, group.id)
      .expire(nameCacheKey, groupCacheExpiry) // 48 hours
      .exec();
    await redisClient.multi()
      .set(idCacheKey, data)
      .expire(idCacheKey, groupCacheExpiry) // 48 hours
      .exec();
  };

  const getGroupCacheByName =async (name: String) => {
    const nameCacheKey = `cache:keycloak:group-id:${name}`;
    let group;
    let groupId = await get(nameCacheKey);
    group = await getGroupCacheById(groupId)
  }

  const getGroupCacheById = async (groupId: String): Promise<Group> => {
    let group;
    const idCacheKey = `cache:keycloak:group:${groupId}`;
    try {
      let data = await get(idCacheKey);
      if (data) {
        let buff = Buffer.from(data, 'base64');
        group = JSON.parse(buff.toString('utf-8'));
        return group
      }
    } catch(err) {
      logger.warn(`Error reading redis ${idCacheKey}, falling back to direct lookup: ${err.message}`);
    }
  }

  return {
    loadAllGroups,
    loadGroupById,
    loadGroupByName,
    loadGroupByIdOrName,
    loadParentGroup,
    loadGroupsByAttribute,
    loadGroupsByProjectId,
    loadGroupsByOrganizationId,
    loadGroupsByOrganizationIdFromGroups,
    loadGroupsByProjectIdFromGroups,
    getProjectsFromGroupAndParents,
    getProjectsFromGroupAndSubgroups,
    getProjectsFromGroup,
    addGroup,
    updateGroup,
    deleteGroup,
    addUserToGroup,
    removeUserFromGroup,
    removeUserFromGroups,
    addProjectToGroup,
    removeProjectFromGroup,
    removeProjectFromGroups,
    transformKeycloakGroups,
    getGroupMembership,
    getGroupMemberCount,
    removeNonProjectDefaultUsersFromGroup
  };
};
