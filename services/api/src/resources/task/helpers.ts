import * as R from 'ramda';
import { Pool } from 'mariadb';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createTaskTask } from '@lagoon/commons/dist/tasks';
import { mQuery } from '../../util/db';
import { pubSub } from '../../clients/pubSub';
import { esClient } from '../../clients/esClient';
import { Sql } from './sql';
import { EVENTS } from './events';
import { Sql as projectSql } from '../project/sql';
import { Sql as environmentSql } from '../environment/sql';

const injectLogs = async task => {
  if (!task.remoteId) {
    return {
      ...task,
      logs: null
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
              { match_phrase: { 'meta.jobStatus': task.status } }
            ]
          }
        }
      }
    });

    if (!result.hits.total) {
      return {
        ...task,
        logs: null
      };
    }

    return {
      ...task,
      logs: R.path(['hits', 'hits', 0, '_source', 'message'], result)
    };
  } catch (e) {
    return {
      ...task,
      logs: `There was an error loading the logs: ${e.message}`
    };
  }
};

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
    const { insertId } = await mQuery(
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

    let rows = await mQuery(sqlClientPool, Sql.selectTask(insertId));
    const taskData = await injectLogs(R.prop(0, rows));

    pubSub.publish(EVENTS.TASK.ADDED, taskData);

    // Allow creating task data w/o executing the task
    if (execute === false) {
      return taskData;
    }

    rows = await mQuery(
      sqlClientPool,
      environmentSql.selectEnvironmentById(taskData.environment)
    );
    const environmentData = R.prop(0, rows);

    rows = await mQuery(
      sqlClientPool,
      projectSql.selectProject(environmentData.project)
    );
    const projectData = R.prop(0, rows);

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
  injectLogs
});
