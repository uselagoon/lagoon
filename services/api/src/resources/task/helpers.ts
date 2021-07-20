import * as R from 'ramda';
import { Pool } from 'mariadb';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createTaskTask, createMiscTask } from '@lagoon/commons/dist/tasks';
import { query } from '../../util/db';
import { pubSub } from '../../clients/pubSub';
import { Sql } from './sql';
import { EVENTS } from './events';
import { Sql as projectSql } from '../project/sql';
import { Sql as environmentSql } from '../environment/sql';
import convertDateToMYSQLDateTimeFormat from '../../util/convertDateToMYSQLDateTimeFormat';

export const Helpers = (sqlClientPool: Pool) => ({
  addTask: async ({
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
    execute
  }: {
    id?: number;
    name: string;
    status?: string;
    created?: string;
    started?: string;
    completed?: string;
    environment: number;
    service: string;
    command: string;
    remoteId?: string;
    execute: boolean;
  }) => {
    const { insertId } = await query(
      sqlClientPool,
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
        // type: null,
        // advanced_image: null,
        // advanced_payload: null,
      }),
    );

    let rows = await query(sqlClientPool, Sql.selectTask(insertId));
    const taskData = R.prop(0, rows);

    pubSub.publish(EVENTS.TASK.ADDED, taskData);

    // Allow creating task data w/o executing the task
    if (execute === false) {
      return taskData;
    }

    rows = await query(
      sqlClientPool,
      environmentSql.selectEnvironmentById(taskData.environment)
    );
    const environmentData = R.prop(0, rows);

    rows = await query(
      sqlClientPool,
      projectSql.selectProject(environmentData.project)
    );
    const projectData = R.prop(0, rows);

    taskData.id = taskData.id.toString();

    try {
      await createTaskTask({
        task: taskData,
        project: projectData,
        environment: environmentData
      });
    } catch (error) {
      sendToLagoonLogs(
        'error',
        projectData.name,
        '',
        'api:addTask',
        { taskId: taskData.id },
        `*[${projectData.name}]* Task not initiated, reason: ${error}`
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
      payload = {},
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
      payload: object,
      remoteId?: string,
      execute: boolean,
    },
  ) => {
    let rows = await query(
      sqlClientPool,
      environmentSql.selectEnvironmentById(environment),
    );
    const environmentData = R.prop(0, rows);

    rows = await query(
      sqlClientPool,
      projectSql.selectProject(environmentData.project),
    );
    const projectData = R.prop(0, rows);


    const  queryresp = await query(
      sqlClientPool,
      Sql.insertTask({
        id,
        name,
        status,
        created,
        started,
        completed,
        environment,
        service,
        command: image,
        remoteId,
        type: 'advanced',
        advanced_image: image,
        advanced_payload: JSON.stringify(payload),
      }),
    );
    console.log(queryresp);
    const { insertId } = queryresp;
    rows = await query(sqlClientPool, Sql.selectTask(insertId));
    const taskData = R.prop(0, rows);
    console.log("*** START ADVANCED TASK DATA OUTPUT ***")
    console.log(taskData);
    console.log("*** END ADVANCED TASK DATA OUTPUT ***")
    // TODO: this will need to change
    const ADVANCED_TASK_EVENT_TYPE = "task:advanced"

    // TODO: we might want to move the actual creation of the advanced task to a function
    // so that we can control the structure in a single place if the schema changes...

    let jobSpec = {
      task: taskData, // BMK: I'm not sure this is used in the advanced task ...
      project: projectData,
      environment: environmentData,
      advancedTask: {
        RunnerImage: image,
        JSONPayload: new Buffer(JSON.stringify(payload).replace(/\\n/g, "\n")).toString('base64')
      }
    }

    // TODO: uncomment and understand
    pubSub.publish(EVENTS.TASK.ADDED, jobSpec);

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

    return taskData;
  },
});
