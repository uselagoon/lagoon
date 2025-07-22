import * as R from 'ramda';
import { Pool } from 'mariadb';
import {
  asyncPipe,
  decodeJSONBase64,
  encodeJSONBase64,
} from '@lagoon/commons/dist/util/func';
import pickNonNil from '../util/pickNonNil';
import { toNumber, getErrorMessage } from '../util/func';
import { getConfigFromEnv } from '../util/config';
import { logger } from '../loggers/logger';
import type { GroupRepresentation, KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { isNetworkError } from '../clients/keycloak-admin';
import { User } from './user';
import {
  get,
  del,
  redisClient,
} from '../clients/redisClient';
import { Helpers as projectHelpers } from '../resources/project/helpers';
import { Helpers as groupHelpers } from '../resources/group/helpers';
import { sqlClientPool } from '../clients/sqlClient';

interface KeycloakLagoonGroupAttributes {
  type?: string[];
  'lagoon-projects'?: string[];
  'lagoon-organization'?: string[];
  'group-lagoon-project-ids'?: string[];
}

export interface KeycloakLagoonGroup extends GroupRepresentation {
  attributes?: KeycloakLagoonGroupAttributes;
  parentId?: string;
}

export enum GroupType {
  ROLE_SUBGROUP = 'role-subgroup',
  PROJECT_DEFAULT_GROUP = 'project-default-group',
}

export interface SparseGroup {
  id: string;
  name: string;
  organization: number | null;
  parentGroupId: string | null;
  projects: Set<number>;
  subGroupCount: number;
  type: GroupType | null;
}

interface HieararchicalGroup extends SparseGroup {
  // Groups as represented by the API spec.
  groups: HieararchicalGroup[];
  // All groups, including internal ones.
  allGroups: HieararchicalGroup[];
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
  attributes?: KeycloakLagoonGroupAttributes;
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

// Group types that are for internal use only.
const internalGroupTypes = [GroupType.ROLE_SUBGROUP];

export const isRoleSubgroup = R.pathEq(
  ['attributes', 'type', 0],
  'role-subgroup'
);

const isInternalGroup = (group: SparseGroup) => {
  if (!group.type) {
    return false;
  }

  if (internalGroupTypes.includes(group.type)) {
    return true;
  }

  return false;
}

const attributeKVOrNull = (key: string, group: GroupRepresentation) =>
  String(R.pathOr(null, ['attributes', key], group));

const parseGroupType = (type: string): GroupType | null => {
  if (Object.values(GroupType).includes(type as GroupType)) {
    return type as GroupType;
  }

  return null;
};

const cacheGroupExpiresSeconds = toNumber(
  getConfigFromEnv('REDIS_GROUP_CACHE_EXPIRY', '172800'), // 2 Days
);

export interface GroupModel {
  loadAllGroups: () => Promise<KeycloakLagoonGroup[]>
  loadGroupById: (id: string) => Promise<Group>
  loadSparseGroupByName: (name: string) => Promise<SparseGroup>
  loadGroupByName: (name: string) => Promise<Group>
  loadGroupByIdOrName: (groupInput: GroupInput) => Promise<Group>
  loadParentGroup: (groupInput: Group) => Promise<Group>
  createGroupFromKeycloak: (group: KeycloakLagoonGroup, projectIdsArray: number[], organizationAttr: number) => SparseGroup
  getProjectsFromGroupAndParents: (group: Group) => Promise<number[]>
  getProjectsFromGroupAndSubgroups: (group: Group) => Promise<number[]>
  getProjectsFromGroup: (group: Group) => Promise<number[]>
  addGroup: (groupInput: Group, projectId?: number, organizationId?: number) => Promise<Group>
  updateGroup: (groupInput: GroupEdit) => Promise<Group>
  deleteGroup: (id: string) => Promise<void>
  removeGroupFromOrganization: (id: string) => Promise<void>
  addUserToGroup: (user: User, groupInput: GroupInput, roleName: string) => Promise<Group>
  removeUserFromGroup: (user: User, group: Group ) => Promise<void>
  removeUserFromGroups: (user: User,groups: Group[]) => Promise<void>
  addProjectToGroup: (projectId: number, groupInput: any) => Promise<void>
  removeProjectFromGroup: (projectId: number, group: Group) => Promise<void>
  removeProjectFromGroups: (projectId: number, groups: Group[]) => Promise<void>
  transformKeycloakGroups: (keycloakGroups: GroupRepresentation[]) => Promise<Group[]>
  getGroupMembership: (group: Group) => Promise<GroupMembership[]>
  getGroupMemberCount: (group: Group) => Promise<number>
  removeNonProjectDefaultUsersFromGroup: (group: Group, project: String) => Promise<Group>
  purgeGroupCache: (group: Pick<Group, 'name' | 'id'>, membersOnly: Boolean) => Promise<void>
}

export const Group = (clients: {
  keycloakAdminClient: KeycloakAdminClient;
  sqlClientPool: Pool;
  esClient: any;
}): GroupModel => {
  const { keycloakAdminClient } = clients;

  const transformKeycloakGroups = async (
    keycloakGroups: GroupRepresentation[]
  ): Promise<Group[]> => {
    // Map from keycloak object to group object
    const groups = await Promise.all(keycloakGroups.map(
      async (keycloakGroup: GroupRepresentation): Promise<Group> => ({
        id: keycloakGroup.id,
        name: keycloakGroup.name,
        type: attributeKVOrNull('type', keycloakGroup),
        path: keycloakGroup.path,
        attributes: keycloakGroup.attributes,
        subGroups: keycloakGroup.subGroups,
        organization: await groupHelpers(sqlClientPool).selectOrganizationIdByGroupId(keycloakGroup.id), // if it exists set it or null
      })
    ));

    let groupsWithGroupsAndMembers = [];

    for (const group of groups) {
      const subGroups = R.reject(isRoleSubgroup)(group.subGroups);
      groupsWithGroupsAndMembers.push({
        ...group,
        groups: R.isEmpty(subGroups)
          ? []
          : await transformKeycloakGroups(subGroups),
      });
    }

    return groupsWithGroupsAndMembers;
  };

  const createGroupFromKeycloak = (group: KeycloakLagoonGroup, projectsArray: number[], organizationAttr: number): SparseGroup => {
    const groupAttr = group.attributes?.['type']?.[0];

    if (!group.id) {
      throw new Error('Missing group id');
    }

    if (!group.name) {
      throw new Error('Missing group name');
    }

    return {
      id: group.id,
      name: group.name,
      organization: organizationAttr,
      parentGroupId: group.parentId ?? null,
      projects: new Set(projectsArray),
      subGroupCount: group.subGroupCount ?? 0,
      type: groupAttr ? parseGroupType(groupAttr) : null,
    };
  };

  // Load a single, lightweight group (no subgroups/members).
  const loadSparseGroupById = async (id: string): Promise<SparseGroup> => {
    const keycloakGroup = (await keycloakAdminClient.groups.findOne({
      id,
    })) as KeycloakLagoonGroup;

    if (!keycloakGroup) {
      throw new GroupNotFoundError(`Group not found: ${id}`);
    }

    // get the projectids from the group_project database table instead of group attributes
    const projectIds = await groupHelpers(sqlClientPool).selectProjectIdsByGroupID(keycloakGroup.id);
    const organizationId = await groupHelpers(sqlClientPool).selectOrganizationIdByGroupId(keycloakGroup.id);

    return createGroupFromKeycloak(keycloakGroup, projectIds, organizationId);
  };

  /**
   * Loads a "full" group from keycloak.
   * @deprecated Use `loadSparseGroupById` instead.
   */
  const loadGroupById = async (id: string): Promise<Group> => {
    let fullGroup = await getGroupCacheById(id);

    if (!fullGroup) {
      const keycloakGroup = (await keycloakAdminClient.groups.findOne({
        id,
      })) as KeycloakLagoonGroup;

      if (!keycloakGroup) {
        throw new GroupNotFoundError(`Group not found: ${id}`);
      }

      const groupWithSubgroups = await loadKeycloakChildren(keycloakGroup);
      const groups = await transformKeycloakGroups([groupWithSubgroups]);
      fullGroup = groups[0];

      await saveGroupCache(fullGroup);
    }

    return fullGroup;
  };

  // Load a single, lightweight group (no subgroups/members).
  const loadSparseGroupByName = async (name: string): Promise<SparseGroup> => {
    const keycloakGroups = (await keycloakAdminClient.groups.find({
      search: name,
      exact: true, // Exact name match
      briefRepresentation: false, // Returns attributes
      // @ts-ignore https://github.com/keycloak/keycloak/issues/32136
      populateHierarchy: false, // Return a single group instead of the full tree
    })) as KeycloakLagoonGroup[];

    if (keycloakGroups.length === 0) {
      throw new GroupNotFoundError(`Group not found: ${name}`);
    }

    if (keycloakGroups.length > 1) {
      throw new Error(
        `Too many results (${keycloakGroups.length}) for ${name}.`,
      );
    }

    // get the projectids from the group_project database table instead of group attributes
    const projectIds = await groupHelpers(sqlClientPool).selectProjectIdsByGroupID(keycloakGroups[0].id);
    const organizationId = await groupHelpers(sqlClientPool).selectOrganizationIdByGroupId(keycloakGroups[0].id);

    return createGroupFromKeycloak(keycloakGroups[0], projectIds, organizationId);
  };

  /**
   * Loads a "full" group from keycloak.
   * @deprecated Use `loadSparseGroupByName` instead.
   */
  const loadGroupByName = async (name: string): Promise<Group> => {
    let fullGroup = await getGroupCacheByName(name);

    if (!fullGroup) {
      const keycloakGroups = (await keycloakAdminClient.groups.find({
        search: name,
        exact: true, // Exact name match
        briefRepresentation: false, // Returns attributes
        // @ts-ignore https://github.com/keycloak/keycloak/issues/32136
        populateHierarchy: false, // Return a single group instead of the full tree
      })) as KeycloakLagoonGroup[];

      if (keycloakGroups.length === 0) {
        throw new GroupNotFoundError(`Group not found: ${name}`);
      }

      if (keycloakGroups.length > 1) {
        throw new Error(
          `Too many results (${keycloakGroups.length}) for ${name}.`,
        );
      }

      const groupWithSubgroups = await loadKeycloakChildren(keycloakGroups[0]);
      const groups = await transformKeycloakGroups([groupWithSubgroups]);
      fullGroup = groups[0];

      await saveGroupCache(fullGroup);
    }

    return fullGroup;
  };

  const loadSparseGroupByIdOrName = async (groupInput: {
    id?: string;
    name?: string;
  }): Promise<SparseGroup> => {
    if (groupInput.id) {
      return loadSparseGroupById(groupInput.id);
    } else if (groupInput.name) {
      return loadSparseGroupByName(groupInput.name);
    } else {
      throw new Error('You must provide a group id or name');
    }
  };

  /**
   * Loads a "full" group from keycloak.
   * @deprecated Use `loadSparseGroupByIdOrName` instead.
   */
  const loadGroupByIdOrName = async (
    groupInput: GroupInput,
  ): Promise<Group> => {
    if (groupInput.id) {
      return loadGroupById(groupInput.id);
    } else if (groupInput.name) {
      return loadGroupByName(groupInput.name);
    } else {
      throw new Error('You must provide a group id or name');
    }
  };

  const loadAllGroups = async (): Promise<KeycloakLagoonGroup[]> => {
    // briefRepresentation pulls all the group information from keycloak
    // including the attributes this means we don't need to iterate over all the
    // groups one by one anymore to get the full group information
    const keycloakGroups = await keycloakAdminClient.groups.find({
      briefRepresentation: false,
    });

    let fullGroups: KeycloakLagoonGroup[] = [];
    for (const group of keycloakGroups) {
      fullGroups.push(await loadKeycloakChildren(group));
    }

    // no need to transform, just return the full response, only the `allGroups`
    // resolvers use this and the `sync-groups-opendistro-security` consumption
    // of this helper sync script is going to go away in the future when we move
    // to the `lagoon-opensearch-sync` supporting service
    return fullGroups;
  };

  const loadSubGroups = async (
    group: SparseGroup | HieararchicalGroup,
    depth: number | null = null,
  ): Promise<HieararchicalGroup> => {
    // Subgroups already loaded.
    if ("groups" in group && "allGroups" in group) {
      return group;
    }

    // There are no subgroups to load.
    if (group.subGroupCount < 1 || depth === 0) {
      return {
        ...group,
        allGroups: [],
        groups: [],
      };
    }

    let keycloakGroups = await keycloakAdminClient.groups.listSubGroups({
      parentId: group.id,
      max: group.subGroupCount,
      briefRepresentation: false, // Returns attributes
    });

    let subGroups: HieararchicalGroup[] = [];
    for (const keycloakGroup of keycloakGroups) {
      // get the projectids from the group_project database table instead of group attributes
      const projectIds = await groupHelpers(sqlClientPool).selectProjectIdsByGroupID(keycloakGroup.id);
      const organizationId = await groupHelpers(sqlClientPool).selectOrganizationIdByGroupId(keycloakGroup.id);

      const subGroup = createGroupFromKeycloak(keycloakGroup, projectIds, organizationId);

      const groupWithSubgroups = await loadSubGroups(subGroup, depth ? depth -1 : null);
      subGroups.push({
        ...subGroup,
        allGroups: groupWithSubgroups.allGroups,
        groups: groupWithSubgroups.allGroups.filter((group: HieararchicalGroup): boolean =>
          !isInternalGroup(group)
        ),
      });
    }

    const groupWithSubgroups = {
      ...group,
      allGroups: subGroups,
      groups: subGroups.filter((group: HieararchicalGroup): boolean =>
        !isInternalGroup(group)
      ),
    };

    return groupWithSubgroups
  };

  const loadKeycloakChildren = async(group: KeycloakLagoonGroup): Promise<KeycloakLagoonGroup> => {
    let keycloakGroups = await keycloakAdminClient.groups.listSubGroups({
      parentId: group.id,
      briefRepresentation: false, // Returns attributes
    });

    let subGroups: KeycloakLagoonGroup[] = [];
    for (const keycloakGroup of keycloakGroups) {
      const groupWithSubgroups = await loadKeycloakChildren(keycloakGroup);
      subGroups.push({
        ...keycloakGroup,
        subGroups: groupWithSubgroups.subGroups,
      });
    }

    return {
      ...group,
      subGroups,
    };
  }

  const loadParentGroup = async (groupInput: Group): Promise<Group> =>
    asyncPipe(
      R.prop('path'),
      R.split('/'),
      R.nth(-2),
      R.cond([[R.isEmpty, R.always(null)], [R.T, loadGroupByName]])
    )(groupInput);

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
    // get the projectids from the group_project database table instead of group attributes
    const projectIds = await groupHelpers(sqlClientPool).selectProjectIdsByGroupID(group.id);

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
      // get the projectids from the group_project database table instead of group attributes
      const groupProjectIds = await groupHelpers(sqlClientPool).selectProjectIdsByGroupID(group.id);

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
      // get the projectids from the group_project database table instead of group attributes
      const groupProjectIds = await groupHelpers(sqlClientPool).selectProjectIdsByGroupID(group.id);
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
    group: Group,
    useCache: boolean = true,
  ): Promise<GroupMembership[]> => {
    let membership: GroupMembership[] = [];

    if (useCache) {
      membership = await getGroupMembershipCache(group.id);
    }

    if (membership.length == 0) {
      const UserModel = User(clients);
      const roleSubgroups = group.subGroups.filter(isRoleSubgroup);

      for (const roleSubgroup of roleSubgroups) {
        const keycloakUsers = await keycloakAdminClient.groups.listMembers({
          id: roleSubgroup.id,
          briefRepresentation: false,
          max: -1,
        });

        let members = [];
        for (const keycloakUser of keycloakUsers) {
          const users = await UserModel.transformKeycloakUsers([keycloakUser]);
          const member = {
            user: users[0],
            role: roleSubgroup.realmRoles[0],
            roleSubgroupId: roleSubgroup.id,
          };

          members = [...members, member];
        }

        membership = [...membership, ...members];
      }

      await saveGroupMembershipCache(group.id, membership);
    }

    return membership;
  };

  const getGroupMemberCount = async (
    group: Group
  ): Promise<number> => {
    const membership = await getGroupMembership(group)
    return membership.length;
  };

  const addGroup = async (
    groupInput: Group,
    projectId?: number,
    organizationId?: number,
  ): Promise<Group> => {
    // Don't allow duplicate subgroup names
    try {
      await loadSparseGroupByName(groupInput.name);
      throw new GroupExistsError(`Group ${R.prop('name', groupInput)} exists`);
    } catch (err: unknown) {
      if (err instanceof GroupNotFoundError) {
        // No group exists with this name already, continue
      } else {
        throw err;
      }
    }

    // Check if parent group exists
    let parentGroup: SparseGroup | undefined;
    if (groupInput?.parentGroupId) {
      try {
        parentGroup = await loadSparseGroupById(groupInput.parentGroupId);
      } catch (err: unknown) {
        if (err instanceof GroupNotFoundError) {
          throw new GroupNotFoundError(
            `Parent group not found ${R.prop('parentGroupId', groupInput)}`,
          );
        }
      }
    }

    let response: { id: string };
    try {
      // @ts-ignore
      response = await keycloakAdminClient.groups.create({
        ...pickNonNil(['id', 'name', 'attributes'], groupInput),
      });
    } catch (err: unknown) {
      if (isNetworkError(err) && err.response.status === 409) {
        throw new GroupExistsError(
          `Group ${R.prop('name', groupInput)} exists`,
        );
      } else if (err instanceof Error) {
        throw new Error(`Error creating Keycloak group: ${err.message}`);
      } else {
        throw err;
      }
    }

    const group = (await loadGroupById(response.id)) as Group & { id: string };
    if (projectId) {
      await groupHelpers(sqlClientPool).addProjectToGroup(projectId, group.id);
    }
    if (organizationId) {
      await groupHelpers(sqlClientPool).addOrganizationToGroup(
        organizationId,
        group.id,
      );
    }

    // Set the parent group
    if (parentGroup) {
      try {
        await keycloakAdminClient.groups.updateChildGroup(
          {
            id: parentGroup.id,
          },
          {
            id: group.id,
            name: group.name,
          },
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.message.includes('location header is not found in request')) {
            // This is a bug in the keycloak client, ignore
          } else {
            throw Error(`Could not set parent group: ${err.message}`);
          }
        } else {
          throw err;
        }
      }
    }

    return group;
  };

  const updateGroup = async (groupInput: GroupEdit): Promise<Group> => {
    const oldGroup = await loadSparseGroupById(groupInput.id);

    try {
      await keycloakAdminClient.groups.update(
        {
          id: groupInput.id,
        },
        //@ts-ignore
        {
          ...pickNonNil(['name', 'attributes'], groupInput),
        },
      );
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        if (err.response.status === 409) {
          throw new GroupExistsError(
            `Group ${R.prop('name', groupInput)} exists`,
          );
        } else if (err.response.status === 404) {
          throw new GroupNotFoundError(`Group not found: ${groupInput.id}`);
        }
      } else if (err instanceof Error) {
        throw new Error(`Error updating Keycloak group: ${err.message}`);
      } else {
        throw err;
      }
    }

    if (groupInput.name && oldGroup.name != groupInput.name) {
      try {
        const newGroup = await loadSparseGroupById(groupInput.id);
        const fullGroup = await loadSubGroups(newGroup, 1);
        for (const subGroup of fullGroup.allGroups) {
          if (subGroup.type == GroupType.ROLE_SUBGROUP) {
            await keycloakAdminClient.groups.update(
              {
                id: subGroup.id,
              },
              {
                name: R.replace(oldGroup.name, groupInput.name, subGroup.name),
              },
            );
          }
        }
      } catch (err: unknown) {
        await purgeGroupCache(oldGroup);
        if (err instanceof Error) {
          throw new Error(
            `Error renaming role subgroups from ${oldGroup.name} to ${groupInput.name}`,
          );
        } else {
          throw err;
        }
      }
    }

    await purgeGroupCache(oldGroup);
    return await loadGroupById(groupInput.id);
  };

  const deleteGroup = async (id: string): Promise<void> => {
    try {
      const group = await loadSparseGroupById(id);
      await groupHelpers(sqlClientPool).deleteGroup(id);
      await purgeGroupCache(group);
      await keycloakAdminClient.groups.del({ id });
    } catch (err: unknown) {
      if (err instanceof GroupNotFoundError) {
        throw err;
      } else if (err instanceof Error) {
        throw new Error(`Error deleting group ${id}: ${err.message}`);
      } else {
        throw err;
      }
    }
  };

  const removeGroupFromOrganization = async (id: string): Promise<void> => {
    try {
      // loadSparseGroupByIdOrName doesn't load the attributes, should it?
      const group = await loadGroupById(id);
      await updateGroup({
        id: group.id,
        name: group.name,
        attributes: {
          ...group.attributes,
          // lagoon-organization attribute is removed for legacy reasons only, theses values are stored in the api-db now
          "lagoon-organization": [""]
        }
      });
      await groupHelpers(sqlClientPool).removeGroupFromOrganization(id);
      await purgeGroupCache(group);
    } catch (err: unknown) {
      if (err instanceof GroupNotFoundError) {
        throw err;
      } else if (err instanceof Error) {
        throw new Error(`Error removing group ${id} from organization: ${err.message}`);
      } else {
        throw err;
      }
    }
  };

  const addUserToGroup = async (
    user: User,
    groupInput: GroupInput,
    roleName: string,
  ): Promise<Group> => {
    const group = await loadSparseGroupByIdOrName(groupInput);

    // Load or create the role subgroup.
    let roleSubgroupID: string | undefined;
    try {
      const roleSubgroup = await loadSparseGroupByName(
        `${group.name}-${roleName}`,
      );
      roleSubgroupID = roleSubgroup.id;
    } catch (err: unknown) {
      if (!(err instanceof GroupNotFoundError)) {
        throw err;
      }
    }

    if (!roleSubgroupID) {
      const roleSubgroup = await addGroup({
        name: `${group.name}-${roleName}`,
        parentGroupId: group.id,
        attributes: {
          type: ['role-subgroup'],
        },
      });
      roleSubgroupID = roleSubgroup.id;
      const role = await keycloakAdminClient.roles.findOneByName({
        name: roleName,
      });
      await keycloakAdminClient.groups.addRealmRoleMappings({
        id: roleSubgroupID,
        roles: [{ id: role.id, name: role.name }],
      });
    }

    // Add the user to the role subgroup.
    try {
      await keycloakAdminClient.users.addToGroup({
        id: user.id,
        groupId: roleSubgroupID,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Could not add user to group: ${err.message}`);
      } else {
        throw err;
      }
    }
    await purgeGroupCache(group);
    return await loadGroupById(group.id);
  };

  const removeUserFromGroup = async (
    user: User,
    group: Group,
  ): Promise<void> => {
    const groupMembers = await getGroupMembership(group, false);
    const userMembership = groupMembers.find(
      (membership: GroupMembership) => membership.user.id == user.id,
    );

    if (userMembership) {
      // Remove user from the role subgroup.
      try {
        await keycloakAdminClient.users.delFromGroup({
          // @ts-ignore
          id: userMembership.user.id,
          // @ts-ignore
          groupId: userMembership.roleSubgroupId,
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(`Could not remove user from group: ${err.message}`);
        } else {
          throw err;
        }
      }

      await purgeGroupCache(group);
    }
  };

  const addProjectToGroup = async (
    projectId: number,
    groupInput: Group,
  ): Promise<void> => {
    const group = await loadSparseGroupByIdOrName(groupInput);
    group.projects.add(projectId);

    const attributes: KeycloakLagoonGroupAttributes = {};
    if (group.type) {
      attributes.type = [group.type];
    }
    // lagoon-organization and lagoon-projects/project-ids attributes are added for legacy reasons only, theses values are stored in the api-db now
    if (group.organization) {
      attributes['lagoon-organization'] = [group.organization.toString()];
    }
    attributes['lagoon-projects'] = [Array.from(group.projects).join(',')];
    attributes['group-lagoon-project-ids'] = [
      `{${JSON.stringify(group.name)}:[${Array.from(group.projects).join(',')}]}`,
    ];

    try {
      await keycloakAdminClient.groups.update(
        {
          id: group.id,
        },
        {
          name: group.name,
          attributes,
        },
      );
      await groupHelpers(sqlClientPool).addProjectToGroup(projectId, group.id);
      // purge the caches to ensure current data
      await purgeGroupCache(group);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(
          `Error setting projects for group ${group.name}: ${err.message}`,
        );
      } else {
        throw err;
      }
    }
  };

  const removeProjectFromGroup = async (
    projectId: number,
    groupInput: Group,
  ): Promise<void> => {
    const group = await loadSparseGroupByIdOrName(groupInput);
    group.projects.delete(projectId);

    const attributes: KeycloakLagoonGroupAttributes = {};
    if (group.type) {
      attributes.type = [group.type];
    }
    // lagoon-organization and lagoon-projects/project-ids attributes are added for legacy reasons only, theses values are stored in the api-db now
    if (group.organization) {
      attributes['lagoon-organization'] = [group.organization.toString()];
    }
    attributes['lagoon-projects'] = [Array.from(group.projects).join(',')];
    attributes['group-lagoon-project-ids'] = [
      `{${JSON.stringify(group.name)}:[${Array.from(group.projects).join(',')}]}`,
    ];

    try {
      await keycloakAdminClient.groups.update(
        {
          id: group.id,
        },
        {
          name: group.name,
          attributes,
        },
      );
      await groupHelpers(sqlClientPool).removeProjectFromGroup(
        projectId,
        group.id,
      );
      // purge the caches to ensure current data
      await purgeGroupCache(group);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(
          `Error setting projects for group ${group.name}: ${err.message}`,
        );
      } else {
        throw err;
      }
    }
  };

  const removeProjectFromGroups = async (
    projectId: number,
    groups: Group[],
  ): Promise<void> => {
    for (const group of groups) {
      await removeProjectFromGroup(projectId, group);
    }
  };

  const removeUserFromGroups = async (
    user: User,
    groups: Group[],
  ): Promise<void> => {
    for (const group of groups) {
      await removeUserFromGroup(user, group);
    }
  };

  const removeNonProjectDefaultUsersFromGroup = async (
    group: Group,
    project: String,
  ): Promise<Group> => {
    const groupMembers = await getGroupMembership(group, false);
    const nonDefaultMembers = groupMembers.filter(
      (member: GroupMembership) =>
        member.user.email != `default-user@${project}`,
    );

    for (const member of nonDefaultMembers) {
      await removeUserFromGroup(member.user, group);
    }

    return await loadGroupById(group.id);
  };

  const purgeGroupCache = async (
    group: Pick<Group, 'name' | 'id'>,
    membersOnly: Boolean = false,
  ): Promise<void> => {
    try {
      if (!membersOnly) {
        // @ts-ignore
        await del(`cache:keycloak:group-id:${group.name}`);
        // @ts-ignore
        await del(`cache:keycloak:group:${group.id}`);
      }
      // @ts-ignore
      await del(`cache:keycloak:group-members:${group.id}`);
    } catch (err: unknown) {
      logger.warn(`Error deleting group cache: ${getErrorMessage(err)}`);
    }
  };

  const saveGroupCache = async (group: Group): Promise<void> => {
    if (!group.id) {
      logger.info('Error saving group cache: Missing group ID');
      return;
    }

    const idCacheKey = `cache:keycloak:group:${group.id}`;
    const nameCacheKey = `cache:keycloak:group-id:${group.name}`;

    try {
      const data = encodeJSONBase64(group)
      await redisClient
        .multi()
        .set(nameCacheKey, group.id)
        .expire(nameCacheKey, cacheGroupExpiresSeconds)
        .set(idCacheKey, data)
        .expire(idCacheKey, cacheGroupExpiresSeconds)
        .exec();
    } catch (err: unknown) {
      logger.info(`Error saving group cache: ${getErrorMessage(err)}`);
    }
  };

  const getGroupCacheByName = async (name: string): Promise<Group | null> => {
    try {
      const groupId = await get(`cache:keycloak:group-id:${name}`);
      return groupId ? await getGroupCacheById(groupId) : null;
    } catch (err: unknown) {
      logger.info(`Error loading group cache by name: ${getErrorMessage(err)}`);

      return null;
    }
  };

  const getGroupCacheById = async (groupId: string): Promise<Group | null> => {
    try {
      let data = await get(`cache:keycloak:group:${groupId}`);

      if (!data) {
        return null;
      }

      return decodeJSONBase64(data);
    } catch (err: unknown) {
      logger.info(`Error loading group cache by id: ${getErrorMessage(err)}`);

      return null;
    }
  };

  const saveGroupMembershipCache = async (
    groupId: string,
    members: GroupMembership[],
  ): Promise<void> => {
    const membersCacheKey = `cache:keycloak:group-members:${groupId}`;

    try {
      const data = encodeJSONBase64(members);
      await redisClient
        .multi()
        .set(membersCacheKey, data)
        .expire(membersCacheKey, cacheGroupExpiresSeconds)
        .exec();
    } catch (err: unknown) {
      logger.info(`Error saving group members cache: ${getErrorMessage(err)}`);
    }
  };

  const getGroupMembershipCache = async (
    groupId: string,
  ): Promise<GroupMembership[]> => {
    try {
      let data = await get(`cache:keycloak:group-members:${groupId}`);

      if (!data) {
        return [];
      }

      return decodeJSONBase64(data);
    } catch (err: unknown) {
      logger.info(`Error loading group members cache: ${getErrorMessage(err)}`);

      return [];
    }
  };

  return {
    loadAllGroups,
    loadGroupById,
    loadSparseGroupByName,
    loadGroupByName,
    loadGroupByIdOrName,
    loadParentGroup,
    createGroupFromKeycloak,
    getProjectsFromGroupAndParents,
    getProjectsFromGroupAndSubgroups,
    getProjectsFromGroup,
    addGroup,
    updateGroup,
    deleteGroup,
    removeGroupFromOrganization,
    addUserToGroup,
    removeUserFromGroup,
    removeUserFromGroups,
    addProjectToGroup,
    removeProjectFromGroup,
    removeProjectFromGroups,
    transformKeycloakGroups,
    getGroupMembership,
    getGroupMemberCount,
    removeNonProjectDefaultUsersFromGroup,
    purgeGroupCache
  };
};
