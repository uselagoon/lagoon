import * as R from 'ramda';
import validator from 'validator';
import { isPatchEmpty } from '../../util/db';
import * as projectHelpers from '../project/helpers';
import { SearchguardOperations } from './searchguard';

export const addGroup = async (_root, { input }, { dataSources, sqlClient, hasPermission }) => {
  await hasPermission('group', 'add');

  if (validator.matches(input.name, /[^0-9a-z-]/)) {
    throw new Error(
      'Only lowercase characters, numbers and dashes allowed for name!',
    );
  }

  let parentGroupId: string;
  if (R.has('parentGroup', input)) {
    if (R.isEmpty(input.parentGroup)) {
      throw new Error('You must provide a group id or name');
    }

    const parentGroup = await dataSources.GroupModel.loadGroupByIdOrName(input.parentGroup);
    parentGroupId = parentGroup.id;
  }


  const group = await dataSources.GroupModel.addGroup({
    name: input.name,
    parentGroupId,
  });

  // We don't have any projects yet. So just an empty string
  await SearchguardOperations(sqlClient, dataSources.GroupModel).syncGroup(input.name, '')

  return group;
};

export const updateGroup = async (
  _root,
  { input: { group: groupInput, patch } },
  { dataSources, hasPermission },
) => {
  const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'update', {
    group: group.id,
  });

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  if (typeof patch.name === 'string') {
    if (validator.matches(patch.name, /[^0-9a-z-]/)) {
      throw new Error(
        'Only lowercase characters, numbers and dashes allowed for name!',
      );
    }
  }

  const updatedGroup = await dataSources.GroupModel.updateGroup({
    id: group.id,
    name: patch.name,
  });

  return updatedGroup;
};

export const deleteGroup = async (
  _root,
  { input: { group: groupInput } },
  { dataSources, sqlClient, hasPermission },
) => {
  const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'delete', {
    group: group.id,
  });

  await dataSources.GroupModel.deleteGroup(group.id);

  await SearchguardOperations(sqlClient, dataSources.GroupModel).deleteGroup(group.name)

  return 'success';
};

export const deleteAllGroups = async (
  _root,
  _args,
  { dataSources, hasPermission },
) => {
  await hasPermission('group', 'deleteAll');

  const groups = await dataSources.GroupModel.loadAllGroups();
  const groupIds = R.pluck('id', groups);

  const deleteGroups = groupIds.map(
    async id => await dataSources.GroupModel.deleteGroup(id),
  );

  try {
    // Deleting all groups in parallel may cause problems, but this is only used
    // in the tests right now and the number of groups for that use case is low.
    await Promise.all(deleteGroups);
  } catch (err) {
    throw new Error(`Could not delete all groups: ${err.message}`);
  }

  return 'success';
};

export const addUserToGroup = async (
  _root,
  { input: { user: userInput, group: groupInput, role } },
  { dataSources, hasPermission },
) => {
  if (R.isEmpty(userInput)) {
    throw new Error('You must provide a user id or email');
  }

  const user = await dataSources.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput),
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a group id or name');
  }

  const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'addUser', {
    group: group.id,
  });

  await dataSources.GroupModel.removeUserFromGroup(user, group);
  const updatedGroup = await dataSources.GroupModel.addUserToGroup(
    user,
    group,
    role,
  );

  return updatedGroup;
};

export const removeUserFromGroup = async (
  _root,
  { input: { user: userInput, group: groupInput } },
  { dataSources, hasPermission },
) => {
  if (R.isEmpty(userInput)) {
    throw new Error('You must provide a user id or email');
  }

  const user = await dataSources.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput),
  });

  if (R.isEmpty(groupInput)) {
    throw new Error('You must provide a group id or name');
  }

  const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);

  await hasPermission('group', 'removeUser', {
    group: group.id,
  });

  const updatedGroup = await dataSources.GroupModel.removeUserFromGroup(
    user,
    group,
  );

  return updatedGroup;
};

export const addGroupsToProject = async (
  _root,
  { input: { project: projectInput, groups: groupsInput } },
  { dataSources, sqlClient, hasPermission },
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput,
  );

  await hasPermission('project', 'addGroup', {
    project: project.id,
  });

  if (R.isEmpty(groupsInput)) {
    throw new Error('You must provide groups');
  }

  const groupsInputNotEmpty = R.filter(R.complement(R.isEmpty), groupsInput);

  if (R.isEmpty(groupsInputNotEmpty)) {
    throw new Error('One or more of your groups is missing an id or name');
  }

  for (const groupInput of groupsInput) {
    const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);
    await dataSources.GroupModel.addProjectToGroup(project.id, group);
  }

  const syncGroups = groupsInput.map(async (groupInput) => {
    const updatedGroup = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);
    const projectIdsArray = await dataSources.GroupModel.getProjectsFromGroupAndSubgroups(updatedGroup)
    const projectIds = R.join(',')(projectIdsArray)
    await SearchguardOperations(sqlClient, dataSources.GroupModel).syncGroup(updatedGroup.name, projectIds);
  });

  try {
    await Promise.all(syncGroups);
  } catch (err) {
    throw new Error(`Could not sync groups with searchguard: ${err.message}`);
  }

  return await projectHelpers(sqlClient).getProjectById(project.id);
};

export const removeGroupsFromProject = async (
  _root,
  { input: { project: projectInput, groups: groupsInput } },
  { dataSources, sqlClient, hasPermission },
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput,
  );

  await hasPermission('project', 'removeGroup', {
    project: project.id,
  });

  if (R.isEmpty(groupsInput)) {
    throw new Error('You must provide groups');
  }

  const groupsInputNotEmpty = R.filter(R.complement(R.isEmpty), groupsInput);

  if (R.isEmpty(groupsInputNotEmpty)) {
    throw new Error('One or more of your groups is missing an id or name');
  }

  for (const groupInput of groupsInput) {
    const group = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);
    await dataSources.GroupModel.removeProjectFromGroup(project.id, group);
  }

  const syncGroups = groupsInput.map(async (groupInput) => {
    const updatedGroup = await dataSources.GroupModel.loadGroupByIdOrName(groupInput);
    // @TODO: Load ProjectIDs of subgroups as well
    const projectIdsArray = await dataSources.GroupModel.getProjectsFromGroupAndSubgroups(updatedGroup)
    const projectIds = R.join(',')(projectIdsArray)
    await SearchguardOperations(sqlClient, dataSources.GroupModel).syncGroup(updatedGroup.name, projectIds);
  });

  try {
    await Promise.all(syncGroups);
  } catch (err) {
    throw new Error(`Could not sync groups with searchguard: ${err.message}`);
  }

  return await projectHelpers(sqlClient).getProjectById(project.id);
};
