import * as R from 'ramda';
import getFieldNames from 'graphql-list-fields';
import { ResolverFn } from '../';
import {
  pubSub,
  createEnvironmentFilteredSubscriber,
} from '../../clients/pubSub';
import {
  knex,
  prepare,
  query,
  isPatchEmpty,
} from '../../util/db';
import { Sql } from './sql';
import EVENTS from './events';
import { Helpers } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Validators as envValidators } from '../environment/validators';
import { getSqlClient } from '../../clients/sqlClient';
import sql from '../user/sql';
import { BreakingChangeType } from 'graphql';
import {TaskRegistration, newTaskRegistrationFromObject} from './models/taskRegistration'
import { getProjectByEnvironmentId } from '../project/resolvers';


const AdvancedTaskDefinitionType = {
  command: "COMMAND",
  image: "IMAGE",
}

const taskStatusTypeToString = R.cond([
  [R.equals('ACTIVE'), R.toLower],
  [R.equals('SUCCEEDED'), R.toLower],
  [R.equals('FAILED'), R.toLower],
  [R.T, R.identity],
]);

const PermissionsToRBAC = (permission:string) => {
return `invoke:${permission.toLowerCase()}`
}


// All query resolvers

export const advancedTaskDefinitionById = async(
  root,
  id,
  { sqlClient, hasPermission },
  ) => {

    await hasPermission('task', 'view', {});
    return await advancedTaskFunctions(sqlClient).advancedTaskDefinitionById(id);
}

export const getRegisteredTasksByEnvironmentId = async(
  { id },
  {},
  { sqlClient, hasPermission },
) => {
  let rows;

  if (!R.isEmpty(id)) {
    rows = await resolveTasksForEnvironment({}, {environment: id}, {sqlClient, hasPermission})
  }

  return rows;
}

export const resolveTasksForEnvironment = async(
  root,
  {environment},
  { sqlClient, hasPermission },
  ) => {

    const environmentDetails = await environmentHelpers(sqlClient).getEnvironmentById(environment);
    await hasPermission('task', 'view', {
      project: environmentDetails.project,
    });

    let environmentRows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionsForEnvironment(environment));

    const proj = await projectHelpers(sqlClient).getProjectByEnvironmentId(environment);
    let projectRows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionsForProject(proj.project));

    //TODO: drop in system level tasks when we have them

    //@ts-ignore
    let rows = R.uniqBy((o) => o.name, R.concat(environmentRows, projectRows))

    return rows;
}

export const advancedTaskDefinitionArgumentById = async(
  root,
  id,
  { sqlClient, hasPermission },
  ) => {
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionArgumentById(id));
    await hasPermission('environment', 'view', {
      project: id,
    });

    return R.prop(0, rows);
}

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
        environment,
        permission,
        created
      },
    },
    { sqlClient, hasPermission },
  ) => {


    const needsAdminRightsToCreate = (project == null && environment == null || type == AdvancedTaskDefinitionType.image);

    let projectObj = await getProjectByEnvironmentIdOrProjectId(sqlClient, environment, project)

    if(needsAdminRightsToCreate) { //if they pass this, they can do basically anything
      //In the first release, we're not actually supporting this
      //TODO: add checks once images are officially supported - for now, throw an error
      throw Error("Adding Images and System Wide Tasks are not yet supported")
    } else if(projectObj) { //does the user have permission to actually add to this?
      //i.e. are they a maintainer?
        await hasPermission('task', `add:production`, {
          project: projectObj.id,
        });
    }

    // There are two cases, either it's a command, in which case the command + service needs to be part of the definition
    // or it's a legit advanced task and we need an image.

    switch(type) {
      case(AdvancedTaskDefinitionType.image):
        if(!image || 0 === image.length) {
          throw new Error("Unable to create Advanced task definition");
        }

      break;
      case(AdvancedTaskDefinitionType.command):
        if(!command || 0 === command.length) {
          throw new Error("Unable to create Advanced task definition");
        }
      break;
      default:
        throw new Error("Undefined Advanced Task Definition type passed at creation time: " + type);
      break;
    }

    //let's see if there's already an advanced task definition with this name ...
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionByNameProjectAndEnvironment(name, project, environment));
    let taskDef = R.prop(0, rows);

    if(taskDef) {
      const taskDefMatchesIncoming = taskDef.description == description &&
      taskDef.image == image &&
      taskDef.type == type &&
      taskDef.command == command;

      if(!taskDefMatchesIncoming) {
        let errorMessage = `Task '${name}' with different definition already exists `
        if(projectObj) {
          errorMessage += ` for Project ${projectObj.name}`
        }
        if(environment) {
          errorMessage += ` on environment number ${environment}`
        }
        throw Error(errorMessage);
      }

      return taskDef;
    }

    const {
        info: { insertId },
    } = await query(
      sqlClient,
      Sql.insertAdvancedTaskDefinition(
        {
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
          permission,
        }
      ),
    );

    return await advancedTaskFunctions(sqlClient).advancedTaskDefinitionById(insertId);
}

const getProjectByEnvironmentIdOrProjectId = async (sqlClient, environment, project) => {
  if(environment) {
    return await projectHelpers(sqlClient).getProjectByEnvironmentId(environment);
  }
  if(project) {
    return await projectHelpers(sqlClient).getProjectById(project);
  }
  return null;
}

export const invokeRegisteredTask = async (
  root,
    {
      advancedTaskDefinition,
      environment
    },
    { sqlClient, hasPermission },
) =>
{
  await envValidators(sqlClient).environmentExists(environment);

  let task = await getNamedAdvancedTaskForEnvironment(sqlClient, hasPermission, advancedTaskDefinition, environment)

  const environmentDetails = await environmentHelpers(sqlClient).getEnvironmentById(environment);
  await hasPermission('task', PermissionsToRBAC(task.permission), {
    project: environmentDetails.project,
  });

  switch(task.type) {
    case(TaskRegistration.TYPE_STANDARD):
      const taskData = await Helpers(sqlClient).addTask({
        id: null,
        name: task.name,
        environment: environment,
        service: task.service,
        command: task.command,
        execute: true,
      });
      return taskData;
    break;
    case(TaskRegistration.TYPE_ADVANCED):

      // the return data here is basically what gets dropped into the DB.
      // what we can do
      const advancedTaskData = await Helpers(sqlClient).addAdvancedTask({
        id: undefined,
        name: task.name,
        status: null,
        created: undefined,
        started: undefined,
        completed: undefined,
        environment,
        service: undefined,
        image: task.image,//the return data here is basically what gets dropped into the DB.
        payload: [],
        remoteId: undefined,
        execute: true,
      });

    return advancedTaskData;
    break;
    default:
      throw new Error("Cannot find matching task")
    break;
  }

  return null
}

const getNamedAdvancedTaskForEnvironment = async (sqlClient, hasPermission, advancedTaskDefinition, environment) => {
  let rows = await resolveTasksForEnvironment({}, {environment}, {sqlClient, hasPermission})
  //@ts-ignore
  const taskDef = R.find((o) => o.id == advancedTaskDefinition, rows)
  if(taskDef == undefined) {
    throw new Error(`Task registration '${advancedTaskDefinition}' could not be found.`);
  }
  return newTaskRegistrationFromObject(taskDef)
}

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
        advancedTaskArguments,
      },
    },
    { sqlClient, hasPermission },
  ) => {

    const status = taskStatusTypeToString(unformattedStatus);

    //There are two kinds of checks we need to make
    // First, can the person currently connected actually run a task on this particular environment
    // second, does this task even connect to the environment at all?
    // This second bit is going to be written now - we resolve tasks at several levels
    // A task is _either_ attached globally, at a group level, at a project level
    // or at an environment level

    await envValidators(sqlClient).environmentExists(environment);
    const envPerm = await environmentHelpers(sqlClient).getEnvironmentById(environment);

    await hasPermission('task', `add:${envPerm.environmentType}`, {
      project: envPerm.project,
    });

    let execute;

    try {
      await hasPermission('task', 'addNoExec', {
        project: envPerm.project,
      });
      execute = executeRequest;
    } catch (err) {
      execute = true;
    }


    //pull advanced task by ID to get the container name
    let addTaskDef = await advancedTaskFunctions(sqlClient).advancedTaskDefinitionById(advancedTaskId)


    // the return data here is basically what gets dropped into the DB.
    // what we can do
    const taskData = await Helpers(sqlClient).addAdvancedTask({
      id,
      name,
      status,
      created,
      started,
      completed,
      environment,
      service,
      image: addTaskDef.image,//the return data here is basically what gets dropped into the DB.
      payload: advancedTaskArguments,
      remoteId,
      execute: false,
    });

    return taskData;
  };

  const validateIncomingArguments = (argList, incomingArgs) => {
    return argList.reduce((prv,curr) => { return R.contains({"name":curr.name}, incomingArgs) && prv} , true);
  }

//TODO: this
export const deleteAdvancedTaskDefinition = async(
  root,
  {
    input: {
      id
    }
  },
  { sqlClient, hasPermission },
  ) => {
}


const advancedTaskFunctions = (sqlClient) => {
    return {
    advancedTaskDefinitionById: async function(id) {
      const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinition(id));
      let taskDef = R.prop(0, rows);
      taskDef.advancedTaskDefinitionArguments = await this.advancedTaskDefinitionArguments(taskDef.id)
      return taskDef
    },
    advancedTaskDefinitionArguments: async function(task_definition_id) {
      const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionArguments(task_definition_id));
      let taskDefArgs = rows;
      return taskDefArgs
    },
  }
}
