// @ts-ignore
import * as R from 'ramda';
import { ResolverFn } from '../';
// @ts-ignore
import validator from 'validator';
import { logger } from '../../loggers/logger';
import { isPatchEmpty } from '../../util/db';
import { GroupNotFoundError } from '../../models/group';
import { Helpers as projectHelpers } from '../project/helpers';
import { OpendistroSecurityOperations } from './opendistroSecurity';
import { KeycloakUnauthorizedError } from '../../util/auth';
import { Helpers as organizationHelpers } from '../organization/helpers';

export const getAllGroups: ResolverFn = async (
  root,
  { name, type },
  { hasPermission, models, keycloakGrant, keycloakGroups, keycloakUsersGroups, adminScopes }
) => {
  // use the admin scope check instead of `hasPermission` for speed
  if (adminScopes.groupViewAll) {
    try {

      if (name) {
        const group = await models.GroupModel.loadGroupByName(name);
        return [group];
      } else {
        const groups = keycloakGroups;
        const filterFn = (key, val) => group => group[key].includes(val);
        const filteredByName = groups.filter(filterFn('name', name));
        const filteredByType = groups.filter(filterFn('type', type));
        return name || type ? R.union(filteredByName, filteredByType) : groups;
      }
    } catch (err) {
      if (name && err instanceof GroupNotFoundError) {
        throw err;
      }

      if (err instanceof KeycloakUnauthorizedError) {
        if (!keycloakGrant) {
          logger.debug('No grant available for getAllGroups');
          return [];
        }
      }

      logger.warn(`getAllGroups failed unexpectedly: ${err.message}`);
      throw err;
    }
  }

  const userGroups = await keycloakUsersGroups;

  if (name) {
    return R.filter(R.propEq('name', name), userGroups);
  } else {
    return userGroups;
  }

};

// TODO: recursive lookups for groups in groups?
export const getGroupFromGroupsById = async (id, groups) => {
  const d = R.filter(R.propEq('id', id), groups);
  if (d.length) {
    return d[0];
  }
  for (const group in groups) {
    if (groups[group].groups.length) {
      const d = R.filter(R.propEq('id', id), groups[group].groups)
      if (d.length) {
        return d[0];
      }
    }
  }
  return {};
}

export const getGroupFromGroupsByName = async (id, groups) => {
  const d = R.filter(R.propEq('name', id), groups);
  if (d.length) {
    return d[0];
  }
  for (const group in groups) {
    if (groups[group].groups.length) {
      const d = R.filter(R.propEq('name', id), groups[group].groups)
      if (d.length) {
        return d[0];
      }
    }
  }
  return {};
}

export const getGroupRolesByUserId: ResolverFn =async (
  { id: uid },
  _input,
  { hasPermission, models, keycloakGrant, keycloakUsersGroups, adminScopes }
) => {
  // use the admin scope check instead of `hasPermission` for speed
  if (adminScopes.groupViewAll) {
    try {
      const queryUserGroups = await models.UserModel.getAllGroupsForUser(uid);
      let groups = []
      for (const g in queryUserGroups) {
        groups.push({id: queryUserGroups[g].id, name: queryUserGroups[g].name, role: queryUserGroups[g].subGroups[0].realmRoles[0]})
      }

      return groups;
    } catch (err) {
      if (!keycloakGrant) {
        logger.debug('No grant available for getGroupsByUserId');
        return [];
      }
    }
  }
  let groups = []
  for (const g in keycloakUsersGroups) {
    groups.push({id: keycloakUsersGroups[g].id, name: keycloakUsersGroups[g].name, role: keycloakUsersGroups[g].subGroups[0].realmRoles[0]})
  }

  return groups;
}

export const getMembersByGroupId: ResolverFn = async (
  { id },
  _input,
  { hasPermission, models, keycloakGrant, keycloakGroups }
) => {
  try {
    // members resolver is only called by group, no need to check the permissions on the group
    // as the group resolver will have already checked permission
    const group = await getGroupFromGroupsById(id, keycloakGroups);
    const members = await models.GroupModel.getGroupMembership(group);
    return members;
  } catch (err) {
    if (err instanceof KeycloakUnauthorizedError) {
      if (!keycloakGrant) {
        logger.debug('No grant available for getGroupByName');
        throw new GroupNotFoundError(`Group not found: ${id}`);
      }
    }

    logger.warn(`getGroupByName failed unexpectedly: ${err.message} ${id}`);
    throw err;
  }
}

export const getGroupsByProjectId: ResolverFn = async (
  { id: pid },
  _input,
  { hasPermission, sqlClientPool, models, keycloakGrant, keycloakGroups, keycloakUsersGroups, adminScopes }
) => {
  // use the admin scope check instead of `hasPermission` for speed
  if (adminScopes.groupViewAll) {
    try {
      const projectGroups = await models.GroupModel.loadGroupsByProjectIdFromGroups(pid, keycloakGroups);
      return projectGroups;
    } catch (err) {
      if (!keycloakGrant) {
        logger.debug('No grant available for getGroupsByProjectId');
        return [];
      }
    }
  } else {
    const projectGroups = await models.GroupModel.loadGroupsByProjectIdFromGroups(pid, keycloakGroups);
    const user = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub
    );

    // if this user is an owner of an organization, then also display org based groups to this user
    // when listing project groups
    const userGroups = keycloakUsersGroups;
    const usersOrgs = R.defaultTo('', R.prop('lagoon-organizations',  user.attributes)).toString()
    const usersOrgsViewer = R.defaultTo('', R.prop('lagoon-organizations-viewer',  user.attributes)).toString()

    if (usersOrgs != "" ) {
      const usersOrgsArr = usersOrgs.split(',');
      for (const userOrg of usersOrgsArr) {
        const project = await projectHelpers(sqlClientPool).getProjectById(pid);
        if (project.organization == userOrg) {
          const orgGroups = await models.GroupModel.loadGroupsByOrganizationId(project.organization);
          for (const pGroup of orgGroups) {
            userGroups.push(pGroup)
          }
        }
      }
    }
    if (usersOrgsViewer != "" ) {
      const usersOrgsArr = usersOrgsViewer.split(',');
      for (const userOrg of usersOrgsArr) {
        const project = await projectHelpers(sqlClientPool).getProjectById(pid);
        if (project.organization == userOrg) {
          const orgViewerGroups = await models.GroupModel.loadGroupsByOrganizationId(project.organization);
          for (const pGroup of orgViewerGroups) {
            userGroups.push(pGroup)
          }
        }
      }
    }
    const userProjectGroups = R.intersection(projectGroups, userGroups);

    return userProjectGroups;
  }
};

export const getGroupsByUserId: ResolverFn = async (
  { id: uid },
  _input,
  { hasPermission, models, keycloakGrant, keycloakUsersGroups, adminScopes }
) => {
  // use the admin scope check instead of `hasPermission` for speed
  if (adminScopes.groupViewAll) {
    try {
      const queryUserGroups = await models.UserModel.getAllGroupsForUser(uid);

      return queryUserGroups;
    } catch (err) {
      if (!keycloakGrant) {
        logger.debug('No grant available for getGroupsByUserId');
        return [];
      }
    }
  }
  const currentUserGroups = keycloakUsersGroups;
  // const bothUserGroups = R.intersection(queryUserGroups, currentUserGroups);

  return currentUserGroups;
};

export const getGroupByName: ResolverFn = async (
  root,
  { name },
  { models, hasPermission, keycloakGrant, keycloakUsersGroups, adminScopes }
) => {
  // use the admin scope check instead of `hasPermission` for speed
  if (adminScopes.groupViewAll) {
    try {
      const group = await models.GroupModel.loadGroupByName(name);
      return group;
    } catch (err) {
      if (err instanceof GroupNotFoundError) {
        throw err;
      }

      if (err instanceof KeycloakUnauthorizedError) {
        if (!keycloakGrant) {
          logger.debug('No grant available for getGroupByName');
          throw new GroupNotFoundError(`Group not found: ${name}`);
        }
      }

      logger.warn(`getGroupByName failed unexpectedly: ${err.message}`);
      throw err;
    }
  }

  const userGroups = keycloakUsersGroups;
  const group = R.head(R.filter(R.propEq('name', name), userGroups));

  if (R.isEmpty(group)) {
    throw new GroupNotFoundError(`Group not found: ${name}`);
  }

  return group;
};

export const addGroup: ResolverFn = async (
  _root,
  { input },
  { models, sqlClientPool, hasPermission, userActivityLogger }
) => {
  let attributes = null;
  // check if this is a group being added in an organization
  // if so, check the user adding the group has permission to do so, and that the organization exists
  if (input.organization != null) {
    const organizationData = await organizationHelpers(sqlClientPool).getOrganizationById(input.organization);
    if (organizationData === undefined) {
      throw new Error(`Organization does not exist`)
    }

    await hasPermission('organization', 'addGroup', {
      organization: input.organization
    });

    const orgGroups = await models.GroupModel.loadGroupsByOrganizationId(input.organization);
    let groupCount = 0
    for (const pGroup in orgGroups) {
      // project-default-groups don't count towards group quotas
      if (orgGroups[pGroup].attributes["type"] != "project-default-group") {
        groupCount++
      }
    }

    if (groupCount >= organizationData.quotaGroup) {
      throw new Error(
        `This would exceed this organizations group quota; ${groupCount}/${organizationData.quotaGroup}`
      );
    }

    attributes = {
      attributes: {
        "lagoon-organization": [input.organization]
      }
    }
  } else {
    // otherwise fall back
    await hasPermission('group', 'add');
  }

  if (validator.matches(input.name, /[^0-9a-z-]/)) {
    throw new Error(
      'Only lowercase characters, numbers and dashes allowed for name!'
    );
  }

  let parentGroupId: string;
  if (R.has('parentGroup', input)) {
    if (R.isEmpty(input.parentGroup)) {
      throw new Error('You must provide a group id or name');
    }

    const parentGroup = await models.GroupModel.loadGroupByIdOrName(
      input.parentGroup
    );
    parentGroupId = parentGroup.id;
  }


  const group = await models.GroupModel.addGroup({
    name: input.name,
    parentGroupId,
    ...attributes,
  });
  await models.GroupModel.addProjectToGroup(null, group);

  // We don't have any projects yet. So just an empty string
  OpendistroSecurityOperations(sqlClientPool, models.GroupModel).syncGroup(
    input.name,
    ''
  );

  userActivityLogger(`User added a group`, {
    project: '',
    event: 'api:addGroup',
    payload: {
      data: {
        group
      }
    }
  });

  return group;
};



export const updateGroup: ResolverFn = async (
  _root,
  { input: { group: groupInput, patch } },
  { models, hasPermission, userActivityLogger }
) => {
  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);

  if (R.prop('lagoon-organization', group.attributes)) {
    // if this is a group in an organization, check that the user updating it has permission to do so before deleting the group
    await hasPermission('organization', 'addGroup', {
      organization: R.prop('lagoon-organization', group.attributes)
    });
  } else {
    await hasPermission('group', 'update', {
      group: group.id
    });
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  if (typeof patch.name === 'string') {
    if (validator.matches(patch.name, /[^0-9a-z-]/)) {
      throw new Error(
        'Only lowercase characters, numbers and dashes allowed for name!'
      );
    }
  }

  const updatedGroup = await models.GroupModel.updateGroup({
    id: group.id,
    name: patch.name
  });

  userActivityLogger(`User updated a group`, {
    project: '',
    event: 'api:updateGroup',
    payload: {
      data: {
        patch,
        updatedGroup
      }
    }
  });

  return updatedGroup;
};

export const deleteGroup: ResolverFn = async (
  _root,
  { input: { group: groupInput } },
  { models, sqlClientPool, hasPermission, userActivityLogger }
) => {
  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);

  if (R.prop('lagoon-organization', group.attributes)) {
    // if this is a group in an organization, check that the user deleting it has permission to do so before deleting the group
    await hasPermission('organization', 'removeGroup', {
      organization: R.prop('lagoon-organization', group.attributes)
    });
  } else {
    await hasPermission('group', 'delete', {
      group: group.id
    });
  }

  await models.GroupModel.deleteGroup(group.id);

  OpendistroSecurityOperations(sqlClientPool, models.GroupModel).deleteGroup(
    group.name
  );
  userActivityLogger(`User deleted a group`, {
    project: '',
    event: 'api:deleteGroup',
    payload: {
      data: {
        group
      }
    }
  });

  return 'success';
};

export const deleteAllGroups: ResolverFn = async (
  _root,
  _args,
  { models, hasPermission, keycloakGroups }
) => {
  await hasPermission('group', 'deleteAll');

  const groups = keycloakGroups;

  let deleteErrors: String[] = [];
  for (const group of groups) {
    try {
      await models.GroupModel.deleteGroup(group.id);
    } catch (err) {
      deleteErrors = [...deleteErrors, `${group.name} (${group.id})`];
    }
  }

  return R.ifElse(R.isEmpty, R.always('success'), deleteErrors => {
    throw new Error(`Could not delete groups: ${deleteErrors.join(', ')}`);
  })(deleteErrors);
};

export const addUserToGroup: ResolverFn = async (
  _root,
  { input: { user: userInput, group: groupInput, role } },
  { models, hasPermission, userActivityLogger }
) => {
  if (R.isEmpty(userInput)) {
    throw new Error('You must provide a user id or email');
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput)
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a group id or name');
  }

  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);

  if (R.prop('lagoon-organization', group.attributes)) {
    // if this is a group in an organization, check that the user adding members to the group in this org is in the org
    await hasPermission('organization', 'addGroup', {
      organization: R.prop('lagoon-organization', group.attributes)
    });
  } else {
    await hasPermission('group', 'addUser', {
      group: group.id
    });
  }

  await models.GroupModel.removeUserFromGroup(user, group);
  const updatedGroup = await models.GroupModel.addUserToGroup(
    user,
    group,
    role
  );

  userActivityLogger(`User added a user to a group`, {
    project: '',
    event: 'api:addUserToGroup',
    payload: {
      input: {
        user: userInput, group: groupInput, role
      },
      data: updatedGroup
    }
  });

  return updatedGroup;
};

export const removeUserFromGroup: ResolverFn = async (
  _root,
  { input: { user: userInput, group: groupInput } },
  { models, hasPermission, userActivityLogger }
) => {
  if (R.isEmpty(userInput)) {
    throw new Error('You must provide a user id or email');
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput)
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a group id or name');
  }

  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);

  if (R.prop('lagoon-organization', group.attributes)) {
    // if this is a group in an organization, check that the user removing members from the group in this org is in the org
    await hasPermission('organization', 'addGroup', {
      organization: R.prop('lagoon-organization', group.attributes)
    });
  } else {
    await hasPermission('group', 'removeUser', {
      group: group.id
    });
  }

  const updatedGroup = await models.GroupModel.removeUserFromGroup(user, group);

  userActivityLogger(`User removed a user from a group`, {
    project: '',
    event: 'api:removeUserFromGroup',
    payload: {
      input: {
        user: userInput, group: groupInput
      },
      data: updatedGroup
    }
  });

  return updatedGroup;
};

export const addGroupsToProject: ResolverFn = async (
  _root,
  { input: { project: projectInput, groups: groupsInput } },
  { models, sqlClientPool, hasPermission, userActivityLogger }
) => {
  const project = await projectHelpers(sqlClientPool).getProjectByProjectInput(
    projectInput
  );
  if (project.organization != null) {
    // this project is in an organization, limit it to organization groups only
    await hasPermission('organization', 'addGroup', {
      organization: project.organization
    });
  } else {
    await hasPermission('project', 'addGroup', {
      project: project.id
    });
  }

  if (R.isEmpty(groupsInput)) {
    throw new Error('You must provide groups');
  }

  const groupsInputNotEmpty = R.filter(R.complement(R.isEmpty), groupsInput);

  if (R.isEmpty(groupsInputNotEmpty)) {
    throw new Error('One or more of your groups is missing an id or name');
  }

  for (const groupInput of groupsInput) {
    const group = await models.GroupModel.loadGroupByIdOrName(groupInput);
    if (R.prop('lagoon-organization', group.attributes) && project.organization != null) {
      if (project.organization == R.prop('lagoon-organization', group.attributes)) {
        // if this is a group in an organization, check that the user removing members from the group in this org is in the org
        await hasPermission('organization', 'addGroup', {
          organization: R.prop('lagoon-organization', group.attributes)
        });
      } else {
        throw new Error('Project must be in same organization as groups');
      }
    }
    await models.GroupModel.addProjectToGroup(project.id, group);
  }

  const syncGroups = groupsInput.map(async groupInput => {
    const updatedGroup = await models.GroupModel.loadGroupByIdOrName(
      groupInput
    );
    const projectIdsArray = await models.GroupModel.getProjectsFromGroupAndSubgroups(
      updatedGroup
    );
    const projectIds = R.join(',')(projectIdsArray);
    OpendistroSecurityOperations(sqlClientPool, models.GroupModel).syncGroup(
      updatedGroup.name,
      projectIds
    );
  });

  try {
    await Promise.all(syncGroups);
  } catch (err) {
    throw new Error(
      `Could not sync groups with opendistro-security: ${err.message}`
    );
  }

  userActivityLogger(`User synced groups to a project`, {
    project: '',
    event: 'api:addGroupsToProject',
    payload: {
      input: {
        project: projectInput, groups: groupsInput
      }
    }
  });

  return await projectHelpers(sqlClientPool).getProjectById(project.id);
};

export const getAllProjectsByGroupId: ResolverFn = async (
  root,
  input,
  context
) => getAllProjectsInGroup(root, { input: { id: root.id } }, { ...context });

export const getAllProjectsInGroup: ResolverFn = async (
  _root,
  { input: groupInput },
  { models, sqlClientPool, hasPermission, keycloakGrant, keycloakGroups, keycloakUsersGroups, adminScopes }
) => {
  const {
    GroupModel: { loadGroupByIdOrName, getProjectsFromGroupAndSubgroups }
  } = models;

  // use the admin scope check instead of `hasPermission` for speed
  if (adminScopes.groupViewAll) {
    try {
      // get group from all keycloak groups apollo context
      let group = [];
      if (groupInput.name) {
        group = await getGroupFromGroupsByName(groupInput.name, keycloakGroups);
      }
      if (groupInput.id) {
        group = await getGroupFromGroupsById(groupInput.id, keycloakGroups);
      }
      const projectIdsArray = await getProjectsFromGroupAndSubgroups(group);
      return projectIdsArray.map(async id =>
        projectHelpers(sqlClientPool).getProjectByProjectInput({ id })
      );
    } catch (err) {
      if (err instanceof GroupNotFoundError) {
        throw err;
      }

      if (!(err instanceof KeycloakUnauthorizedError)) {
        logger.warn(`getAllGroups failed unexpectedly: ${err.message}`);
        throw err;
      }
    }
  }

  if (!keycloakGrant) {
    logger.debug('No grant available for getAllProjectsInGroup');
    return [];
  } else {
    // get group from all keycloak groups apollo context
    let group = [];
    if (groupInput.name) {
      group = await getGroupFromGroupsByName(groupInput.name, keycloakGroups);
    }
    if (groupInput.id) {
      group = await getGroupFromGroupsById(groupInput.id, keycloakGroups);
    }
    // get users groups from users keycloak groups apollo context
    const userGroups = keycloakUsersGroups;
    const user = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub
    );
    const usersOrgs = R.defaultTo('', R.prop('lagoon-organizations',  user.attributes)).toString()
    const usersOrgsViewer = R.defaultTo('', R.prop('lagoon-organizations-viewer',  user.attributes)).toString()
    if (usersOrgs != "" ) {
      const usersOrgsArr = usersOrgs.split(',');
      for (const userOrg of usersOrgsArr) {
        const orgGroups = await models.GroupModel.loadGroupsByOrganizationId(userOrg);
        for (const pGroup of orgGroups) {
          userGroups.push(pGroup)
        }
      }
    }
    if (usersOrgsViewer != "" ) {
      const usersOrgsArr = usersOrgsViewer.split(',');
      for (const userOrg of usersOrgsArr) {
        const orgViewerGroups = await models.GroupModel.loadGroupsByOrganizationId(userOrg);
        for (const pGroup of orgViewerGroups) {
          userGroups.push(pGroup)
        }
      }
    }
    // @ts-ignore
    if (!R.contains(group.name, R.pluck('name', userGroups))) {
      logger.debug('No grant available for getAllProjectsInGroup');
      return [];
    }
    const projectIdsArray = await getProjectsFromGroupAndSubgroups(group);
    return projectIdsArray.map(async id =>
      projectHelpers(sqlClientPool).getProjectByProjectInput({ id })
    );
  }
};

export const removeGroupsFromProject: ResolverFn = async (
  _root,
  { input: { project: projectInput, groups: groupsInput } },
  { models, sqlClientPool, hasPermission }
) => {
  const project = await projectHelpers(sqlClientPool).getProjectByProjectInput(
    projectInput
  );

  // check if this is a group being removed by an organization
  // if so, check the user removing the group has permission to do so, and that the organization exists
  if (project.organization != null) {
    const organizationData = await organizationHelpers(sqlClientPool).getOrganizationById(project.organization);
    if (organizationData === undefined) {
      throw new Error(`Organization does not exist`)
    }

    await hasPermission('organization', 'removeGroup', {
      organization: project.organization
    });
  } else {
    // otherwise fall back
    await hasPermission('project', 'removeGroup', {
      project: project.id
    });
  }

  if (R.isEmpty(groupsInput)) {
    throw new Error('You must provide groups');
  }

  const groupsInputNotEmpty = R.filter(R.complement(R.isEmpty), groupsInput);

  if (R.isEmpty(groupsInputNotEmpty)) {
    throw new Error('One or more of your groups is missing an id or name');
  }

  for (const groupInput of groupsInput) {
    const group = await models.GroupModel.loadGroupByIdOrName(groupInput);
    await models.GroupModel.removeProjectFromGroup(project.id, group);
  }

  const syncGroups = groupsInput.map(async groupInput => {
    const updatedGroup = await models.GroupModel.loadGroupByIdOrName(
      groupInput
    );
    // @TODO: Load ProjectIDs of subgroups as well
    const projectIdsArray = await models.GroupModel.getProjectsFromGroupAndSubgroups(
      updatedGroup
    );
    const projectIds = R.join(',')(projectIdsArray);
    OpendistroSecurityOperations(sqlClientPool, models.GroupModel).syncGroup(
      updatedGroup.name,
      projectIds
    );
  });

  try {
    await Promise.all(syncGroups);
  } catch (err) {
    throw new Error(
      `Could not sync groups with opendistro-security: ${err.message}`
    );
  }

  return await projectHelpers(sqlClientPool).getProjectById(project.id);
};
