// @flow

/* ::
import type MariaSQL from 'mariasql';
*/

const R = require('ramda');
const { sendToLagoonLogs } = require('@lagoon/commons/dist/logs');
const { createTaskTask } = require('@lagoon/commons/dist/tasks');
const { query } = require('../../util/db');
const { pubSub } = require('../../clients/pubSub');
const esClient = require('../../clients/esClient');
const Sql = require('./sql');
const EVENTS = require('./events');
const projectSql = require('../project/sql');
const environmentSql = require('../environment/sql');

const injectLogs = async (task /* : Object */) => {
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

const Helpers = (sqlClient /* : MariaSQL */) => ({
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
    } /* : { id?: number, name: string, status?: string, created?: string, started?: string, completed?: string, environment: number, service: string, command: string, remoteId?: string, execute: boolean } */,
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
  injectLogs,
});

module.exports = Helpers;
