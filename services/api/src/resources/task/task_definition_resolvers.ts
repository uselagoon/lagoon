import * as R from 'ramda';
import getFieldNames from 'graphql-list-fields';
import { ResolverFn } from '../';
import {
  pubSub,
  createEnvironmentFilteredSubscriber
} from '../../clients/pubSub';
import { knex, query, isPatchEmpty } from '../../util/db';
import { Sql } from './sql';
import { EVENTS } from './events';
import { Helpers } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Validators as envValidators } from '../environment/validators';
import {
  TaskRegistration,
  newTaskRegistrationFromObject
} from './models/taskRegistration';
import { system } from 'faker';

const AdvancedTaskDefinitionType = {
  command: 'COMMAND',
  image: 'IMAGE'
};

const taskStatusTypeToString = R.cond([
  [R.equals('ACTIVE'), R.toLower],
  [R.equals('SUCCEEDED'), R.toLower],
  [R.equals('FAILED'), R.toLower],
  [R.T, R.identity]
]);

const PermissionsToRBAC = (permission: string) => {
  return `invoke:${permission.toLowerCase()}`;
};

// All query resolvers

export const advancedTaskDefinitionById = async (
  root,
  id,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('task', 'view', {});
  return await advancedTaskFunctions(sqlClientPool).advancedTaskDefinitionById(
    id
  );
};

export const getRegisteredTasksByEnvironmentId = async (
  { id },
  {},
  { sqlClientPool, hasPermission, models }
) => {
  let rows;

  if (!R.isEmpty(id)) {
    rows = await resolveTasksForEnvironment(
      {},
      { environment: id },
      { sqlClientPool, hasPermission, models }
    );
  }

  return rows;
};

export const resolveTasksForEnvironment = async (
  root,
  { environment },
  { sqlClientPool, hasPermission, models }
) => {
  const environmentDetails = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environment);
  await hasPermission('task', 'view', {
    project: environmentDetails.project
  });

  let environmentRows = await query(
    sqlClientPool,
    Sql.selectAdvancedTaskDefinitionsForEnvironment(environment)
  );

  //grab group names ...
  const proj = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(
    environment
  );

  let projectRows = await query(
    sqlClientPool,
    Sql.selectAdvancedTaskDefinitionsForProject(proj.project)
  );

  const projectGroups = await models.GroupModel.loadGroupsByProjectId(
    proj.projectId
  );

  const projectGroupsFiltered = R.pluck('name', projectGroups);

  let groupRows = await query(
    sqlClientPool,
    Sql.selectAdvancedTaskDefinitionsForGroups(projectGroupsFiltered)
  );
  //see if there are any matching tasks based on group membership

  //TODO: drop in system level tasks when we have them

  //@ts-ignore
  let rows = R.uniqBy(
    o => o.name,
    R.concat(R.concat(environmentRows, projectRows), groupRows)
  );
  return rows;
};

export const advancedTaskDefinitionArgumentById = async (
  root,
  id,
  { sqlClientPool, hasPermission }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectAdvancedTaskDefinitionArgumentById(id)
  );
  await hasPermission('environment', 'view', {
    project: id
  });

  return R.prop(0, rows);
};

export const addAdvancedTaskDefinition = async (
  root,
  {
    input: {
      id,
      name,
      description,
      image = '',
      type,
      service,
      command,
      project,
      groupName,
      environment,
      permission,
      created
    }
  },
  { sqlClientPool, hasPermission }
) => {
  const systemLevelTask =
    project == null && environment == null && groupName == null;
  const advancedTaskWithImage = type == AdvancedTaskDefinitionType.image;
  const needsAdminRightsToCreate =
    systemLevelTask || advancedTaskWithImage || groupName;

  let projectObj = await getProjectByEnvironmentIdOrProjectId(
    sqlClientPool,
    environment,
    project
  );

  if (systemLevelTask || advancedTaskWithImage) {
    //if they pass this, they can do basically anything
    //In the first release, we're not actually supporting this
    //TODO: add checks once images are officially supported - for now, throw an error
    throw Error('AdAding Images and System Wide Tasks are not yet supported');
  } else if (groupName) {
    //TODO: is the user an admin?
    console.log('TODO: IMPLEMENT - group level tasks test');
  } else if (projectObj) {
    //does the user have permission to actually add to this?
    //i.e. are they a maintainer?
    await hasPermission('task', `add:production`, {
      project: projectObj.id
    });
  }

  // There are two cases, either it's a command, in which case the command + service needs to be part of the definition
  // or it's a legit advanced task and we need an image.

  switch (type) {
    case AdvancedTaskDefinitionType.image:
      if (!image || 0 === image.length) {
        throw new Error('Unable to create Advanced task definition');
      }
      break;
    case AdvancedTaskDefinitionType.command:
      if (!command || 0 === command.length) {
        throw new Error('Unable to create Advanced task definition');
      }
      break;
    default:
      throw new Error(
        'Undefined Advanced Task Definition type passed at creation time: ' +
          type
      );
      break;
  }

  //let's see if there's already an advanced task definition with this name ...
  const rows = await query(
    sqlClientPool,
    Sql.selectAdvancedTaskDefinitionByNameProjectEnvironmentAndGroup(
      name,
      project,
      environment,
      groupName
    )
  );
  let taskDef = R.prop(0, rows);

  if (taskDef) {
    const taskDefMatchesIncoming =
      taskDef.description == description &&
      taskDef.image == image &&
      taskDef.type == type &&
      taskDef.command == command;

    if (!taskDefMatchesIncoming) {
      let errorMessage = `Task '${name}' with different definition already exists `;
      if (projectObj) {
        errorMessage += ` for Project ${projectObj.name}`;
      }
      if (environment) {
        errorMessage += ` on environment number ${environment}`;
      }
      if (groupName) {
        errorMessage += ` and group ${groupName}`;
      }
      throw Error(errorMessage);
    }
    return taskDef;
  }

  const { insertId } = await query(
    sqlClientPool,
    Sql.insertAdvancedTaskDefinition({
      id: null,
      name,
      description,
      image,
      command,
      created: null,
      type,
      service,
      project,
      environment,
      group_name: groupName,
      permission
    })
  );

  return await advancedTaskFunctions(sqlClientPool).advancedTaskDefinitionById(
    insertId
  );
};

const getProjectByEnvironmentIdOrProjectId = async (
  sqlClientPool,
  environment,
  project
) => {
  if (environment) {
    return await projectHelpers(sqlClientPool).getProjectByEnvironmentId(
      environment
    );
  }
  if (project) {
    return await projectHelpers(sqlClientPool).getProjectById(project);
  }
  return null;
};

export const invokeRegisteredTask = async (
  root,
  { advancedTaskDefinition, environment },
  { sqlClientPool, hasPermission, models }
) => {
  await envValidators(sqlClientPool).environmentExists(environment);

  let task = await getNamedAdvancedTaskForEnvironment(
    sqlClientPool,
    hasPermission,
    advancedTaskDefinition,
    environment,
    models
  );

  const environmentDetails = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environment);
  await hasPermission('advanced_task', PermissionsToRBAC(task.permission), {
    project: environmentDetails.project
  });

  switch (task.type) {
    case TaskRegistration.TYPE_STANDARD:
      const taskData = await Helpers(sqlClientPool).addTask({
        id: null,
        name: task.name,
        environment: environment,
        service: task.service,
        command: task.command,
        execute: true
      });
      return taskData;
      break;
    case TaskRegistration.TYPE_ADVANCED:
      // the return data here is basically what gets dropped into the DB.
      // what we can do
      const advancedTaskData = await Helpers(sqlClientPool).addAdvancedTask({
        id: undefined,
        name: task.name,
        status: null,
        created: undefined,
        started: undefined,
        completed: undefined,
        environment,
        service: undefined,
        image: task.image, //the return data here is basically what gets dropped into the DB.
        payload: [],
        remoteId: undefined,
        execute: true
      });

      return advancedTaskData;
      break;
    default:
      throw new Error('Cannot find matching task');
      break;
  }

  return null;
};

const getNamedAdvancedTaskForEnvironment = async (
  sqlClientPool,
  hasPermission,
  advancedTaskDefinition,
  environment,
  models
) => {
  let rows = await resolveTasksForEnvironment(
    {},
    { environment },
    { sqlClientPool, hasPermission, models }
  );
  //@ts-ignore
  const taskDef = R.find(o => o.id == advancedTaskDefinition, rows);
  if (taskDef == undefined) {
    throw new Error(
      `Task registration '${advancedTaskDefinition}' could not be found.`
    );
  }
  return newTaskRegistrationFromObject(taskDef);
};

export const addAdvancedTask: ResolverFn = async (
  root,
  {
    input: {
      id,
      name,
      status: unformattedStatus,
      created,
      started,
      completed,
      environment,
      service,
      advancedTaskId,
      remoteId,
      execute: executeRequest,
      advancedTaskArguments
    }
  },
  { sqlClientPool, hasPermission }
) => {
  const status = taskStatusTypeToString(unformattedStatus);

  //There are two kinds of checks we need to make
  // First, can the person currently connected actually run a task on this particular environment
  // second, does this task even connect to the environment at all?
  // This second bit is going to be written now - we resolve tasks at several levels
  // A task is _either_ attached globally, at a group level, at a project level
  // or at an environment level

  await envValidators(sqlClientPool).environmentExists(environment);
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environment
  );

  await hasPermission('task', `add:${envPerm.environmentType}`, {
    project: envPerm.project
  });

  let execute;

  try {
    await hasPermission('task', 'addNoExec', {
      project: envPerm.project
    });
    execute = executeRequest;
  } catch (err) {
    execute = true;
  }

  //pull advanced task by ID to get the container name
  let addTaskDef = await advancedTaskFunctions(
    sqlClientPool
  ).advancedTaskDefinitionById(advancedTaskId);

  // the return data here is basically what gets dropped into the DB.
  // what we can do
  const taskData = await Helpers(sqlClientPool).addAdvancedTask({
    id,
    name,
    status,
    created,
    started,
    completed,
    environment,
    service,
    image: addTaskDef.image, //the return data here is basically what gets dropped into the DB.
    payload: advancedTaskArguments,
    remoteId,
    execute: false
  });

  return taskData;
};

//TODO: this
export const deleteAdvancedTaskDefinition = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission }
) => {};

const advancedTaskFunctions = sqlClientPool => {
  return {
    advancedTaskDefinitionById: async function(id) {
      const rows = await query(
        sqlClientPool,
        Sql.selectAdvancedTaskDefinition(id)
      );
      let taskDef = R.prop(0, rows);
      taskDef.advancedTaskDefinitionArguments = await this.advancedTaskDefinitionArguments(
        taskDef.id
      );
      return taskDef;
    },
    advancedTaskDefinitionArguments: async function(task_definition_id) {
      const rows = await query(
        sqlClientPool,
        Sql.selectAdvancedTaskDefinitionArguments(task_definition_id)
      );
      let taskDefArgs = rows;
      return taskDefArgs;
    }
  };
};
