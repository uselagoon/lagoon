import * as R from 'ramda';
import { MariaClient } from 'mariasql';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createTaskTask, createMiscTask } from '@lagoon/commons/dist/tasks';
import { query } from '../../util/db';
import { pubSub } from '../../clients/pubSub';
import esClient from '../../clients/esClient';
import { Sql } from './sql';
import EVENTS from './events';
import { Sql as projectSql } from '../project/sql';
import { Sql as environmentSql } from '../environment/sql';
import convertDateToMYSQLDateTimeFormat from '../../util/convertDateToMYSQLDateTimeFormat';

const injectLogs = async (task) => {
  if (!task.remoteId) {
    return {
      ...task,
      logs: null,
    };
  }

  try {
    const result = await esClient.search({
      index: 'lagoon-logs-*',
      sort: '@timestamp:desc',
      body: {
        query: {
          bool: {
            must: [
              { match_phrase: { 'meta.remoteId': task.remoteId } },
              { match_phrase: { 'meta.jobStatus': task.status } },
            ],
          },
        },
      },
    });

    if (!result.hits.total) {
      return {
        ...task,
        logs: null,
      };
    }

    return {
      ...task,
      logs: R.path(['hits', 'hits', 0, '_source', 'message'], result),
    };
  } catch (e) {
    return {
      ...task,
      logs: `There was an error loading the logs: ${e.message}`,
    };
  }
};

export const Helpers = (sqlClient: MariaClient) => ({
  addTask: async (
    {
      id,
      name,
      status,
      created,
      started,
      completed,
      environment,
      service,
      command,
      remoteId,
      execute,
    }: {
      id?: number,
      name: string,
      status?: string,
      created?: string,
      started?: string,
      completed?: string,
      environment: number,
      service: string,
      command: string,
      remoteId?: string,
      execute: boolean
    },
  ) => {
    const {
      info: { insertId },
    } = await query(
      sqlClient,
      Sql.insertTask({
        id,
        name,
        status,
        created,
        started,
        completed,
        environment,
        service,
        command,
        remoteId,
      }),
    );

    let rows = await query(sqlClient, Sql.selectTask(insertId));
    const taskData = await injectLogs(R.prop(0, rows));

    pubSub.publish(EVENTS.TASK.ADDED, taskData);

    // Allow creating task data w/o executing the task
    if (execute === false) {
      return taskData;
    }

    rows = await query(
      sqlClient,
      environmentSql.selectEnvironmentById(taskData.environment),
    );
    const environmentData = R.prop(0, rows);

    rows = await query(
      sqlClient,
      projectSql.selectProject(environmentData.project),
    );
    const projectData = R.prop(0, rows);

    try {
      await createTaskTask({
        task: taskData,
        project: projectData,
        environment: environmentData,
      });
    } catch (error) {
      sendToLagoonLogs(
        'error',
        projectData.name,
        '',
        'api:addTask',
        { taskId: taskData.id },
        `*[${projectData.name}]* Task not initiated, reason: ${error}`,
      );
    }

    return taskData;
  },
  addAdvancedTask: async (
    {
      id,
      name,
      status,
      created,
      started,
      completed,
      environment,
      service,
      image,
      remoteId,
      execute,
    }: {
      id?: number,
      name: string,
      status?: string,
      created?: string,
      started?: string,
      completed?: string,
      environment: number,
      service: string,
      image: string,
      remoteId?: string,
      execute: boolean
    },
  ) => {



    // const {
    //   info: { insertId },
    // } = await query(
    //   sqlClient,
    //   Sql.insertTask({
    //     id,
    //     name,
    //     status,
    //     created,
    //     started,
    //     completed,
    //     environment,
    //     service,
    //     command,
    //     remoteId,
    //   }),
    // );

    //TODO: in the first pass I'm going to use the "command" field to store the name of the task we want to run
    // We can change the "task" db going forward to be sensitive to advanced tasks themselves
    // in the first



    // TODO: we need to write this into the DB in some format
    // suggestion - add advanced task details to table?
    // short term, hijack 'command' for the image name

    // let rows = await query(sqlClient, Sql.selectTask(insertId));
    // const taskData = await injectLogs(R.prop(0, rows));

    // TODO: uncomment and understand
    // pubSub.publish(EVENTS.TASK.ADDED, taskData);

    let rows = await query(
      sqlClient,
      environmentSql.selectEnvironmentById(environment),
    );
    const environmentData = R.prop(0, rows);

    rows = await query(
      sqlClient,
      projectSql.selectProject(environmentData.project),
    );
    const projectData = R.prop(0, rows);

    // TODO: this will need to change
    const ADVANCED_TASK_EVENT_TYPE = "task:advanced"

    // TODO: we might want to move the actual creation of the advanced task to a function
    // so that we can control the structure in a single place if the schema changes...

    let jobSpec = {
      //task: taskData, // BMK: I'm not sure this is used in the advanced task ...
      project: projectData,
      environment: environmentData,
      advancedTask: {
        RunnerImage: image,
        JSONPayload: '{}'//TODO: stringify when we actually have data -> new Buffer(JSON.stringify(jsonPayload).replace(/\\n/g, "\n")).toString('base64')
      }
    }

    console.log(jobSpec);

    try {
      await createMiscTask(
        {
          key: ADVANCED_TASK_EVENT_TYPE,
          data: jobSpec
        }
      )
    } catch (error) {
      // sendToLagoonLogs(
      //   'error',
      //   projectData.name,
      //   '',
      //   'api:addTask',
      //   // { taskId: taskData.id },
      //   `*[${projectData.name}]* Task not initiated, reason: ${error}`,
      // );
    }

    return {
      id: 1,
      name,
      status,
      created,
      started,
      completed,
      environment,
      service,
      remoteId,
      execute,
    }
  },
  injectLogs,
});
