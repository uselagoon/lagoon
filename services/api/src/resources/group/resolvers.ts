import * as R from 'ramda';
import { ResolverFn } from '../';
import validator from 'validator';
import { logger } from '../../loggers/logger';
import { isPatchEmpty } from '../../util/db';
import { GroupNotFoundError } from '../../models/group';
import { Helpers as projectHelpers } from '../project/helpers';
import { OpendistroSecurityOperations } from './opendistroSecurity';
import { KeycloakUnauthorizedError } from '../../util/auth';

export const getAllGroups: ResolverFn = async (
  root,
  { name, type },
  { hasPermission, models, keycloakGrant, keycloakGroups, keycloakUsersGroups, adminScopes, userActivityLogger }
) => {
  // use the admin scope check instead of `hasPermission` for speed
  if (adminScopes.groupViewAll) {
    try {

      if (name) {
        const group = await models.GroupModel.loadGroupByName(name);
        userActivityLogger(`User queried getAllGroups`, {
          project: '',
          event: 'api:getAllGroups',
          payload: {
            name: name
          },
        }, 'user_query');
        return [group];
      } else {
        const groups = keycloakGroups;
        const filterFn = (key, val) => group => group[key].includes(val);
        const filteredByName = groups.filter(filterFn('name', name));
        const filteredByType = groups.filter(filterFn('type', type));
        userActivityLogger(`User queried getAllGroups`, {
          project: '',
          event: 'api:getAllGroups',
          payload: {
            name: 'allGroupsFilter'
          },
        }, 'user_query');
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

  userActivityLogger(`User queried getAllGroups`, {
    project: '',
    event: 'api:getAllGroups',
    payload: {
      name: 'allGroups'
    },
  }, 'user_query');

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
  { hasPermission, models, keycloakGrant, keycloakUsersGroups, adminScopes, userActivityLogger }
) => {

  userActivityLogger(`User queried getGroupRolesByUserId`, {
    project: '',
    event: 'api:getGroupRolesByUserId',
    payload: { data: { user: { id: uid } } }
  }, 'user_query');

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
  { hasPermission, models, keycloakGrant, keycloakGroups, userActivityLogger }
) => {
  try {
    // members resolver is only called by group, no need to check the permissions on the group
    // as the group resolver will have already checked permission
    const group = await getGroupFromGroupsById(id, keycloakGroups);
    const members = await models.GroupModel.getGroupMembership(group);

    userActivityLogger(`User queried getMembersByGroupId`, {
      project: '',
      event: 'api:getMembersByGroupId',
      payload: { data: { group: { id: id } } }
    }, 'user_query');

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
  { hasPermission, models, keycloakGrant, keycloakGroups, keycloakUsersGroups, adminScopes, userActivityLogger }
) => {

    userActivityLogger(`User queried getGroupsByProjectId`, {
      project: '',
      event: 'api:getGroupsByProjectId',
      payload: { id: pid }
    }, 'user_query');

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
  }

  const projectGroups = await models.GroupModel.loadGroupsByProjectIdFromGroups(pid, keycloakGroups);
  const userGroups = keycloakUsersGroups;
  const userProjectGroups = R.intersection(projectGroups, userGroups);

  return userProjectGroups;
};

export const getGroupsByUserId: ResolverFn = async (
  { id: uid },
  _input,
  { hasPermission, models, keycloakGrant, keycloakUsersGroups, adminScopes, userActivityLogger }
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

  userActivityLogger(`User queried getGroupsByUserId`, {
    project: '',
    event: 'api:getGroupsByUserId',
    payload: { data: { user: { id: uid } } }
  }, 'user_query');

  return currentUserGroups;
};

export const getGroupByName: ResolverFn = async (
  root,
  { name },
  { models, hasPermission, keycloakGrant, keycloakUsersGroups, adminScopes, userActivityLogger }
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

  userActivityLogger(`User queried getGroupByName`, {
    project: '',
    event: 'api:getGroupByName',
    payload: { name: name }
  }, 'user_query');

  return group;
};

export const addGroup: ResolverFn = async (
  _root,
  { input },
  { models, sqlClientPool, keycloakGrant, adminScopes, hasPermission, userActivityLogger }
) => {
  await hasPermission('group', 'add');

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
    parentGroupId
  });
  await models.GroupModel.addProjectToGroup(null, group);

  // if the user is not an admin, then add the user as an owner to the group
  if (!adminScopes.projectViewAll && keycloakGrant) {
    const user = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub
    );

    try {
      await models.GroupModel.addUserToGroup(user, group, 'owner');
    } catch (err) {
      logger.error(
        `Could not link requesting user to group ${group.name}: ${err.message}`
      );
    }
  }

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

  await hasPermission('group', 'update', {
    group: group.id
  });

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

  await hasPermission('group', 'delete', {
    group: group.id
  });

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

  await hasPermission('group', 'addUser', {
    group: group.id
  });

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

  await hasPermission('group', 'removeUser', {
    group: group.id
  });

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

  await hasPermission('project', 'addGroup', {
    project: project.id
  });

  if (R.isEmpty(groupsInput)) {
    throw new Error('You must provide groups');
  }

  const groupsInputNotEmpty = R.filter(R.complement(R.isEmpty), groupsInput);

  if (R.isEmpty(groupsInputNotEmpty)) {
    throw new Error('One or more of your groups is missing an id or name');
  }

  for (const groupInput of groupsInput) {
    const group = await models.GroupModel.loadGroupByIdOrName(groupInput);
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
  { models, sqlClientPool, hasPermission, keycloakGrant, keycloakGroups, keycloakUsersGroups, adminScopes, userActivityLogger }
) => {
  const {
    GroupModel: { loadGroupByIdOrName, getProjectsFromGroupAndSubgroups }
  } = models;

  userActivityLogger(`User queried getAllProjectsInGroup`, {
    project: '',
    event: 'api:getAllProjectsInGroup',
    payload: { data: { group: { id: groupInput.id } } },
  }, 'user_query');

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
  { models, sqlClientPool, hasPermission, userActivityLogger }
) => {
  const project = await projectHelpers(sqlClientPool).getProjectByProjectInput(
    projectInput
  );

  await hasPermission('project', 'removeGroup', {
    project: project.id
  });

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

  userActivityLogger(`User removed groups from a project`, {
    project: project.id,
    event: 'api:removeGroupsFromProject',
    payload: {
       input: { project: projectInput, groups: groupsInput },
    }
  });

  return await projectHelpers(sqlClientPool).getProjectById(project.id);
};
