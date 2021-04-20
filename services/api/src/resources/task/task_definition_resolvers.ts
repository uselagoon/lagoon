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
//import { getProjectByEnvironmentId } from '../project/helpers';
import {TaskRegistration, newTaskRegistrationFromObject} from './models/taskRegistration'
import { getProjectByEnvironmentId } from '../project/resolvers';


// We'll use a couple of classes to ensure that our helper functions are getting the data they require



// All query resolvers

export const advancedTaskDefinitionById = async(
  root,
  id,
  { sqlClient, hasPermission },
  ) => {
    //TODO: we'll need to do a lot of work here when it comes to the permissions system
    // essentially we only want to display the definitions a user has access to via their
    // groups, projects, etc.
    return await advancedTaskFunctions(sqlClient).advancedTaskDefinitionById(id);
}


const canTaskBeRunInEnvironment = async (sqlClient, environmentId: number, task: TaskRegistration) => {
  //if the task is attached directly to the environment, we're good to go.
  if(task.environment && task.environment == environmentId) {
    return true;
  }

  // grab project for environment
  try {
    const proj = await projectHelpers(sqlClient).getProjectByEnvironmentId(environmentId);
    // //else we have to check the environment against its project
    console.log(proj)
    if(task.project && task.project == proj.project) {
      return true;
    }

  } catch(ex) {
    return false
  }

  return false
}


export const resolveTasksForEnvironment = async(
  root,
  {id},
  { sqlClient, hasPermission },
  ) => {
    //TODO: we'll need to do a lot of work here when it comes to the permissions system
    // essentially we only want to display the definitions a user has access to via their
    // groups, projects, etc.
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionsForEnvironment(id));
    return rows;
}

export const getRegisteredTasksByEnvironmentId = async(
  { id },
  {},
  { sqlClient, hasPermission },
) => {
  let rows;
  if (!R.isEmpty(id)) {
    rows = await query(sqlClient, Sql.selectTaskRegistrationsByEnvironmentId(id));
  }

  return rows;
}



export const getAllAdvancedTaskDefinitions = async(
  root,
  {
    //   input: {
    //   }
  },
  { sqlClient, hasPermission },
  ) => {
    //TODO: we'll need to do a lot of work here when it comes to the permissions system
    // essentially we only want to display the definitions a user has access to via their
    // groups, projects, etc.
    // const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitions());
    let rows = await advancedTaskFunctions(sqlClient).advancedTaskDefinitions(null)
    return rows;
}

export const getAdvancedTaskDefinitionByName = async(
  root,
  {
    name
  },
  { sqlClient, hasPermission },
  ) => {
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionByName(name));
    let taskDef = R.prop(0, rows);

    taskDef.taskArguments = await advancedTaskFunctions(sqlClient).advancedTaskDefinitionArguments(taskDef.id)
    return taskDef
}


export const advancedTaskDefinitionArgumentById = async(
  root,
  id,
  { sqlClient, hasPermission },
  ) => {
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionArgumentById(id));
    return R.prop(0, rows);
}



//Mutation resolvers

const AdvancedTaskDefinitionType = {
  command: "COMMAND",
  image: "IMAGE",
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
        created
      },
    },
    { sqlClient, hasPermission },
  ) => {
    //TODO: we need to consider who creates these definitions
    // Essentially, we want whoever creates this to determine the overall access permissions to the task
    // This can be done in the iteration that introduces links to environments/groups/etc.


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
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionByName(name));
    let taskDef = R.prop(0, rows);

    console.log(taskDef);

    let createNewTask = true;

    if(taskDef) {


      console.log("service is - " + service)
      const taskDefMatchesIncoming = taskDef.description == description &&
      taskDef.image == image &&
      taskDef.type == type &&
      // taskDef.service == service &&
      taskDef.command == command;

      if(!taskDefMatchesIncoming) {
        throw Error(`Task with name ${name} already exists`);
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
          command,
        }
      ),
    );

    return await advancedTaskFunctions(sqlClient).advancedTaskDefinitionById(insertId);
}

export const addAdvancedTaskDefinitionToProject = async (
  root,
  {
    input: {
      id,
      advancedTaskDefinition,
      project
    },
  },
  { sqlClient, hasPermission },
) => {



  //TODO: we need to consider who creates these definitions
  // Essentially, we want whoever creates this to determine the overall access permissions to the task
  // This can be done in the iteration that introduces links to environments/groups/etc.

  const {
      info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertAdvancedTaskDefinitionProjectLink(
      {
        id: null,
        advanced_task_definition: advancedTaskDefinition,
        project,
      }
    ),
  );

  // let rows = await query(sqlClient,Sql.selectAdvancedTaskDefinitionEnvironmentLinkById(insertId));
  // let row = R.prop(0, rows)
  // console.log(row);
  // let ret = {id: row.id, advancedTask: row.taskDefinition, environment: row.environment}
  // console.log(ret)
  return {id: insertId}
}


export const addAdvancedTaskDefinitionToEnvironment = async (
  root,
  {
    input: {
      id,
      advancedTaskDefinition,
      environment,
    },
  },
  { sqlClient, hasPermission },
) => {
  //TODO: we need to consider who creates these definitions
  // Essentially, we want whoever creates this to determine the overall access permissions to the task
  // This can be done in the iteration that introduces links to environments/groups/etc.

  //Check advanced task exists
  try {
    const advancedTaskDefinitionDetails = await adTaskFunctions(sqlClient).advancedTaskDefinitionById(advancedTaskDefinition)

    if(advancedTaskDefinitionDetails == null) {
      throw Error(`Cannot find advanced task definition with id: ${advancedTaskDefinition}`)
    }
  } catch(ex) {
    throw Error(`Cannot find advanced task definition with id: ${advancedTaskDefinition}`)
  }

  const {
      info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertAdvancedTaskDefinitionEnvironmentLink(
      {
        id: null,
        advanced_task_definition: advancedTaskDefinition,
        environment
      }
    ),
  );

  let rows = await query(sqlClient,Sql.selectAdvancedTaskDefinitionEnvironmentLinkById(insertId));
  let row = R.prop(0, rows)
  console.log(row);
  let ret = {id: row.id, advancedTask: row.taskDefinition, environment: row.environment}
  console.log(ret)
  return ret
}



//TODO: DRY out into defs file
const taskStatusTypeToString = R.cond([
    [R.equals('ACTIVE'), R.toLower],
    [R.equals('SUCCEEDED'), R.toLower],
    [R.equals('FAILED'), R.toLower],
    [R.T, R.identity],
  ]);


export const invokeRegisteredTask = async (
  root,
    {
      taskRegistration,
      environment
    },
    { sqlClient, hasPermission },
) =>
{

  //selectTaskRegistrationById
  let rows = await query(sqlClient,Sql.selectTaskRegistrationById(taskRegistration));
  let task = newTaskRegistrationFromObject(R.prop(0, rows))

  if (R.isEmpty(task)) {
    throw new Error(`Task '${taskRegistration}' could not be found.`);
  }

  //check current user can invoke tasks in this environment ...
  await envValidators(sqlClient).environmentExists(environment);
  const envPerm = await environmentHelpers(sqlClient).getEnvironmentById(environment);
  await hasPermission('task', `add:${envPerm.environmentType}`, {
    project: envPerm.project,
  });

  //check this task can _be invoked_ on this environment
  let taskCanBeRun = await canTaskBeRunInEnvironment(sqlClient, environment, task)

  if(!taskCanBeRun) {
    throw new Error(`Task "${task.name}" cannot be run in environment`);
  }

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

      //TODO: DRY THIS OUT ASAP

      //pull advanced task by ID to get the container name
      let addTaskDef = await advancedTaskFunctions(sqlClient).advancedTaskDefinitionById(task.advanced_task_definition)


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
        image: addTaskDef.image,//the return data here is basically what gets dropped into the DB.
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

export const registerTask = async (
  root,
    {
      input: {
        id,
        type,
        name,
        description,
        advancedTaskDefinition,
        environment,
        project,
        command,
        service,
      },
    },
    { sqlClient, hasPermission },
) =>
{

  // Check - if this is a project linked item, does the person have access to add to projects?

  // Check - if this is an environment linked item, does the client have access to add to this environment?


  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertTaskRegistration(
      {
        id: null,
        type,
        name,
        description,
        advanced_task_definition: advancedTaskDefinition,
        environment,
        project,
        command,
        service,
        created: null,
        deleted: null,
      }
    ),
  );

  let rows = await query(sqlClient,Sql.selectTaskRegistrationById(insertId));
  let row = R.prop(0, rows)
  console.log(row)
  return row
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



// TODO: question - do we actually want to ever update these tasks, or is it a create/delete only story
// The issue, as I see it, is that if tasks are updated, they may require different arguments - so versioning them makes more sense than updating.

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
    advancedTaskDefinitions: async function(id) {
      console.log("here")
      let rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitions());
      console.log(rows.length)
      for(let i = 0; i < rows.length; i++) {
        console.log(rows[i])
        rows[i].advancedTaskDefinitionArguments = await this.advancedTaskDefinitionArguments(rows[i].id)
      }
      return rows
    },
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
    addAdvancedTaskToEnvironment: async function(root, task_definition_id) {
      const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionArguments(task_definition_id));
      let taskDefArgs = rows;
      return taskDefArgs
    },
  }
}
