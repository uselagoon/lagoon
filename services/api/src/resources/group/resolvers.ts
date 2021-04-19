import * as R from 'ramda';
import { ResolverFn } from '../';
import validator from 'validator';
import * as logger from '../../logger';
import { isPatchEmpty } from '../../util/db';
import { GroupNotFoundError } from '../../models/group';
import { Helpers as projectHelpers } from '../project/helpers';
import { OpendistroSecurityOperations } from './opendistroSecurity';
import { KeycloakUnauthorizedError } from '../../util/auth';

export const getAllGroups: ResolverFn = async (
  root,
  { name, type },
  { hasPermission, models, keycloakGrant }
) => {
  try {
    await hasPermission('group', 'viewAll');

    if (name) {
      const group = await models.GroupModel.loadGroupByName(name);
      return [group];
    } else {
      const groups = await models.GroupModel.loadAllGroups();
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
        logger.warn('Access denied to user for getAllGroups');
        return [];
      } else {
        const user = await models.UserModel.loadUserById(
          keycloakGrant.access_token.content.sub
        );
        const userGroups = await models.UserModel.getAllGroupsForUser(user);

        if (name) {
          return R.filter(R.propEq('name', name), userGroups);
        } else {
          return userGroups;
        }
      }
    }

    logger.warn(`getAllGroups failed unexpectedly: ${err.message}`);
    throw err;
  }
};

export const getGroupsByProjectId: ResolverFn = async (
  { id: pid },
  _input,
  { hasPermission, models, keycloakGrant }
) => {
  const projectGroups = await models.GroupModel.loadGroupsByProjectId(pid);

  try {
    await hasPermission('group', 'viewAll');

    return projectGroups;
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getGroupsByProjectId');
      return [];
    }

    const user = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub
    );
    const userGroups = await models.UserModel.getAllGroupsForUser(user);
    const userProjectGroups = R.intersection(projectGroups, userGroups);

    return userProjectGroups;
  }
};

export const getGroupsByUserId: ResolverFn = async (
  { id: uid },
  _input,
  { hasPermission, models, keycloakGrant }
) => {
  const queryUser = await models.UserModel.loadUserById(uid);
  const queryUserGroups = await models.UserModel.getAllGroupsForUser(queryUser);

  try {
    await hasPermission('group', 'viewAll');

    return queryUserGroups;
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getGroupsByUserId');
      return [];
    }

    const currentUser = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub
    );
    const currentUserGroups = await models.UserModel.getAllGroupsForUser(
      currentUser
    );
    const bothUserGroups = R.intersection(queryUserGroups, currentUserGroups);

    return bothUserGroups;
  }
};

export const getGroupByName: ResolverFn = async (
  root,
  { name },
  { models, hasPermission, keycloakGrant }
) => {
  try {
    await hasPermission('group', 'viewAll');

    const group = await models.GroupModel.loadGroupByName(name);
    return group;
  } catch (err) {
    if (err instanceof GroupNotFoundError) {
      throw err;
    }

    if (err instanceof KeycloakUnauthorizedError) {
      if (!keycloakGrant) {
        logger.warn('Access denied to user for getGroupByName');
        throw new GroupNotFoundError(`Group not found: ${name}`);
      } else {
        const user = await models.UserModel.loadUserById(
          keycloakGrant.access_token.content.sub
        );
        const userGroups = await models.UserModel.getAllGroupsForUser(user);

        const group = R.head(R.filter(R.propEq('name', name), userGroups));

        if (R.isEmpty(group)) {
          throw new GroupNotFoundError(`Group not found: ${name}`);
        }

        return group;
      }
    }

    logger.warn(`getGroupByName failed unexpectedly: ${err.message}`);
    throw err;
  }
};

export const addGroup = async (
  _root,
  { input },
  { models, sqlClient, hasPermission }
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

  // We don't have any projects yet. So just an empty string
  OpendistroSecurityOperations(sqlClient, models.GroupModel).syncGroup(
    input.name,
    ''
  );

  return group;
};

export const updateGroup: ResolverFn = async (
  _root,
  { input: { group: groupInput, patch } },
  { models, hasPermission }
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

  return updatedGroup;
};

export const deleteGroup: ResolverFn = async (
  _root,
  { input: { group: groupInput } },
  { models, sqlClient, hasPermission }
) => {
  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'delete', {
    group: group.id
  });

  await models.GroupModel.deleteGroup(group.id);

  OpendistroSecurityOperations(sqlClient, models.GroupModel).deleteGroup(
    group.name
  );

  return 'success';
};

export const deleteAllGroups: ResolverFn = async (
  _root,
  _args,
  { models, hasPermission }
) => {
  await hasPermission('group', 'deleteAll');

  const groups = await models.GroupModel.loadAllGroups();

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
  { models, hasPermission }
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

  return updatedGroup;
};

export const removeUserFromGroup: ResolverFn = async (
  _root,
  { input: { user: userInput, group: groupInput } },
  { models, hasPermission }
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

  return updatedGroup;
};

export const addGroupsToProject: ResolverFn = async (
  _root,
  { input: { project: projectInput, groups: groupsInput } },
  { models, sqlClient, hasPermission }
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
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
    OpendistroSecurityOperations(sqlClient, models.GroupModel).syncGroup(
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

  return await projectHelpers(sqlClient).getProjectById(project.id);
};

export const getAllProjectsByGroupId: ResolverFn = async (
  root,
  input,
  context
) => getAllProjectsInGroup(root, { input: { id: root.id } }, { ...context });

export const getAllProjectsInGroup: ResolverFn = async (
  _root,
  { input: groupInput },
  { models, sqlClient, hasPermission, keycloakGrant }
) => {
  const {
    GroupModel: { loadGroupByIdOrName, getProjectsFromGroupAndSubgroups }
  } = models;

  try {
    await hasPermission('group', 'viewAll');

    const group = await loadGroupByIdOrName(groupInput);
    const projectIdsArray = await getProjectsFromGroupAndSubgroups(group);
    return projectIdsArray.map(async id =>
      projectHelpers(sqlClient).getProjectByProjectInput({ id })
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

  if (!keycloakGrant) {
    logger.warn(
      'Access denied to user for getAllProjectsInGroup: no keycloakGrant'
    );
    return [];
  } else {
    const group = await loadGroupByIdOrName(groupInput);

    const user = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub
    );
    const userGroups = await models.UserModel.getAllGroupsForUser(user);

    // @ts-ignore
    if (!R.contains(group.name, R.pluck('name', userGroups))) {
      logger.warn(
        'Access denied to user for getAllProjectsInGroup: user not in group'
      );
      return [];
    }

    const projectIdsArray = await getProjectsFromGroupAndSubgroups(group);
    return projectIdsArray.map(async id =>
      projectHelpers(sqlClient).getProjectByProjectInput({ id })
    );
  }
};

export const removeGroupsFromProject: ResolverFn = async (
  _root,
  { input: { project: projectInput, groups: groupsInput } },
  { models, sqlClient, hasPermission }
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
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
    OpendistroSecurityOperations(sqlClient, models.GroupModel).syncGroup(
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

  return await projectHelpers(sqlClient).getProjectById(project.id);
};
