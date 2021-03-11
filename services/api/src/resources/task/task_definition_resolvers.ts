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

export const addAdvancedTaskDefinition = async (
    root,
    {
      input: {
        id,
        name,
        description,
        image,
        created,
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

    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinition(insertId));
    return R.prop(0, rows);
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

    // let execute;
    // try {
    //   await hasPermission('task', 'addNoExec', {
    //     project: envPerm.project,
    //   });
    //   execute = executeRequest;
    // } catch (err) {
    //   execute = true;
    // }


    //pull advanced task by ID to get the container name
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinition(advancedTaskId));
    let addTaskDef = R.prop(0, rows);

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
      remoteId,
      execute: false,
    });

    console.log(taskData)
    return taskData;
  };


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
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitions());
    return R.prop(0, rows);
}

export const getAdvancedTaskDefinitionByName = async(
  root,
  {
    name
  },
  { sqlClient, hasPermission },
  ) => {
    const rows = await query(sqlClient, Sql.selectAdvancedTaskDefinitionByName(name));
    return R.prop(0, rows);
}