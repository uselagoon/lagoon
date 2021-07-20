import * as R from 'ramda';
import { Pool } from 'mariadb';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createTaskTask } from '@lagoon/commons/dist/tasks';
import { query } from '../../util/db';
import { pubSub } from '../../clients/pubSub';
import { Sql } from './sql';
import { EVENTS } from './events';
import { Sql as projectSql } from '../project/sql';
import { Sql as environmentSql } from '../environment/sql';

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
        remoteId
      })
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
  }
});
