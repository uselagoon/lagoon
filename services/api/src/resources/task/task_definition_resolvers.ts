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
import { Validators as envValidators } from '../environment/validators';
import { getSqlClient } from '../../clients/sqlClient';
import sql from '../user/sql';




export const addAdvancedTaskDefinition = async (
    root,
    {
      input: {
        id,
        name,
        description,
        image,
        created,
        taskArguments
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
      Sql.insertAdvancedTaskDefinition(
        {
          id: null,
          name,
          description,
          image,
          created: null,
        }
      ),
    );

    return await adTaskFunctions.advancedTaskDefinitionById(root, insertId, sqlClient);
}


//TODO: DRY out into defs file
const taskStatusTypeToString = R.cond([
    [R.equals('ACTIVE'), R.toLower],
    [R.equals('SUCCEEDED'), R.toLower],
    [R.equals('FAILED'), R.toLower],
    [R.T, R.identity],
  ]);


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
        taskArguments,
      },
    },
    { sqlClient, hasPermission },
  ) => {

    const status = taskStatusTypeToString(unformattedStatus);

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
    let addTaskDef = await adTaskFunctions.advancedTaskDefinitionById(root, advancedTaskId, sqlClient)

    // if(addTaskDef.taskArguments.length > 0) {
    //   console.log(addTaskDef)
    //   console.log(validateIncomingArguments(addTaskDef.taskArguments, taskArguments))
    // }


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
      payload: taskArguments,
      remoteId,
      execute: false,
    });

    return taskData;
  };

  const validateIncomingArguments = (argList, incomingArgs) => {
    return argList.reduce((prv,curr) => { return R.contains({"name":curr.name}, incomingArgs) && prv} , true);
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
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitions());
    return rows;
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

export const advancedTaskDefinitionById = async(
  root,
  {
    input: {
      id
    }
  },
  { sqlClient, hasPermission },
  ) => {
    //TODO: we'll need to do a lot of work here when it comes to the permissions system
    // essentially we only want to display the definitions a user has access to via their
    // groups, projects, etc.
    return await adTaskFunctions.advancedTaskDefinitionById(root, id, sqlClient);
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

    taskDef.taskArguments = await adTaskFunctions.advancedTaskDefinitionArguments(root, taskDef.id, sqlClient)
    return taskDef
}


const adTaskFunctions = {
  advancedTaskDefinitionById: async(root, id, sqlClient) => {
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitions());
    let taskDef = R.prop(0, rows);
    taskDef.taskArguments = await adTaskFunctions.advancedTaskDefinitionArguments(root, taskDef.id, sqlClient)
    return taskDef
  },
  advancedTaskDefinitionArguments: async(root, task_definition_id, sqlClient) => {
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionArguments(task_definition_id));
    let taskDefArgs = rows;
    return taskDefArgs
  }
}