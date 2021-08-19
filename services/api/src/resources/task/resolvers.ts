import * as R from 'ramda';
import { ResolverFn } from '../';
import {
  pubSub,
  createEnvironmentFilteredSubscriber
} from '../../clients/pubSub';
import { esClient } from '../../clients/esClient';
import { knex, query, isPatchEmpty } from '../../util/db';
import { Sql } from './sql';
import { EVENTS } from './events';
import { Helpers } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Validators as envValidators } from '../environment/validators';

export const getTaskLog: ResolverFn = async (
  { remoteId, status },
  _args,
  _context
) => {
  if (!remoteId) {
    return null;
  }

  try {
    const result = await esClient.search({
      index: 'lagoon-logs-*',
      sort: '@timestamp:desc',
      body: {
        query: {
          bool: {
            must: [
              { match_phrase: { 'meta.remoteId': remoteId } },
              { match_phrase: { 'meta.jobStatus': status } }
            ]
          }
        }
      }
    });

    if (!result.hits.total) {
      return null;
    }

    return R.path(['hits', 'hits', 0, '_source', 'message'], result);
  } catch (e) {
    return `There was an error loading the logs: ${e.message}`;
  }
};

export const getTasksByEnvironmentId: ResolverFn = async (
  { id: eid },
  { id: filterId, limit },
  { sqlClientPool, hasPermission }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(eid);
  await hasPermission('task', 'view', {
    project: environment.project
  });

  let queryBuilder = knex('task')
    .where('environment', eid)
    .orderBy('created', 'desc')
    .orderBy('id', 'desc');

  if (filterId) {
    queryBuilder = queryBuilder.andWhere('id', filterId);
  }

  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  return query(sqlClientPool, queryBuilder.toString());
};

export const getTaskByRemoteId: ResolverFn = async (
  root,
  { id },
  { sqlClientPool, hasPermission }
) => {
  const queryString = knex('task')
    .where('remote_id', '=', id)
    .toString();

  const rows = await query(sqlClientPool, queryString);
  const task = R.prop(0, rows);

  if (!task) {
    return null;
  }

  const rowsPerms = await query(sqlClientPool, Sql.selectPermsForTask(task.id));
  await hasPermission('task', 'view', {
    project: R.path(['0', 'pid'], rowsPerms)
  });

  return task;
};

export const getTaskById: ResolverFn = async (
  root,
  { id },
  { sqlClientPool, hasPermission }
) => {
  const queryString = knex('task')
    .where('id', '=', id)
    .toString();

  const rows = await query(sqlClientPool, queryString);
  const task = R.prop(0, rows);

  if (!task) {
    return null;
  }

  const rowsPerms = await query(sqlClientPool, Sql.selectPermsForTask(task.id));
  await hasPermission('task', 'view', {
    project: R.path(['0', 'pid'], rowsPerms)
  });

  return task;
};

export const addTask: ResolverFn = async (
  root,
  {
    input: {
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
      execute: executeRequest
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
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

  userActivityLogger.user_action(`User added task '${name}'`, {
    project: '',
    event: 'api:addTask',
    payload: {
      input: {
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
        execute: executeRequest
      }
    }
  });

  const taskData = await Helpers(sqlClientPool).addTask({
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
  });

  return taskData;
};

export const deleteTask: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rows = await query(sqlClientPool, Sql.selectPermsForTask(id));
  await hasPermission('task', 'delete', {
    project: R.path(['0', 'pid'], rows)
  });

  await query(sqlClientPool, Sql.deleteTask(id));

  userActivityLogger.user_action(`User deleted task '${id}'`, {
    project: '',
    event: 'api:deleteTask',
    payload: {
      input: {
        id
      }
    }
  });

  return 'success';
};

export const updateTask: ResolverFn = async (
  root,
  {
    input: {
      id,
      patch,
      patch: {
        name,
        status,
        created,
        started,
        completed,
        environment,
        service,
        command,
        remoteId
      }
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  // Check access to modify task as it currently stands
  const curPerms = await query(sqlClientPool, Sql.selectPermsForTask(id));
  await hasPermission('task', 'update', {
    project: R.path(['0', 'pid'], curPerms)
  });

  if (environment) {
    // Check access to modify task as it will be updated
    const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
      environment
    );
    await hasPermission('task', 'update', {
      project: envPerm.project
    });
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  await query(
    sqlClientPool,
    Sql.updateTask({
      id,
      patch: {
        name,
        status,
        created,
        started,
        completed,
        environment,
        service,
        command,
        remoteId
      }
    })
  );

  const rows = await query(sqlClientPool, Sql.selectTask(id));
  const taskData = R.prop(0, rows);

  pubSub.publish(EVENTS.TASK.UPDATED, taskData);

  userActivityLogger.user_action(`User updated task '${id}'`, {
    project: '',
    event: 'api:updateTask',
    payload: {
      patch: {
        name,
        status,
        created,
        started,
        completed,
        environment,
        service,
        command,
        remoteId
      }
    }
  });

  return taskData;
};

export const taskDrushArchiveDump: ResolverFn = async (
  root,
  { environment: environmentId },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await envValidators(sqlClientPool).environmentExists(environmentId);
  await envValidators(sqlClientPool).environmentHasService(
    environmentId,
    'cli'
  );
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('task', `drushArchiveDump:${envPerm.environmentType}`, {
    project: envPerm.project
  });

  const command = String.raw`file="/tmp/$LAGOON_PROJECT-$LAGOON_GIT_SAFE_BRANCH-$(date --iso-8601=seconds).tar" && drush ard --destination=$file && \
TOKEN="$(ssh -p $TASK_SSH_PORT -t lagoon@$TASK_SSH_HOST token)" && curl -sS "$TASK_API_HOST"/graphql \
-H "Authorization: Bearer $TOKEN" \
-F operations='{ "query": "mutation ($task: Int!, $files: [Upload!]!) { uploadFilesForTask(input:{task:$task, files:$files}) { id files { filename } } }", "variables": { "task": '"$TASK_DATA_ID"', "files": [null] } }' \
-F map='{ "0": ["variables.files.0"] }' \
-F 0=@$file; rm -rf $file;
`;

  userActivityLogger.user_action(
    `User triggered a Drush Archive Dump task on environment '${environmentId}'`,
    {
      project: '',
      event: 'api:taskDrushArchiveDump',
      payload: {
        environment: environmentId
      }
    }
  );

  const taskData = await Helpers(sqlClientPool).addTask({
    name: 'Drush archive-dump',
    environment: environmentId,
    service: 'cli',
    command,
    execute: true
  });

  return taskData;
};

export const taskDrushSqlDump: ResolverFn = async (
  root,
  { environment: environmentId },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await envValidators(sqlClientPool).environmentExists(environmentId);
  await envValidators(sqlClientPool).environmentHasService(
    environmentId,
    'cli'
  );
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('task', `drushSqlDump:${envPerm.environmentType}`, {
    project: envPerm.project
  });

  const command = String.raw`file="/tmp/$LAGOON_PROJECT-$LAGOON_GIT_SAFE_BRANCH-$(date --iso-8601=seconds).sql" && drush sql-dump --result-file=$file --gzip && \
TOKEN="$(ssh -p $TASK_SSH_PORT -t lagoon@$TASK_SSH_HOST token)" && curl -sS "$TASK_API_HOST"/graphql \
-H "Authorization: Bearer $TOKEN" \
-F operations='{ "query": "mutation ($task: Int!, $files: [Upload!]!) { uploadFilesForTask(input:{task:$task, files:$files}) { id files { filename } } }", "variables": { "task": '"$TASK_DATA_ID"', "files": [null] } }' \
-F map='{ "0": ["variables.files.0"] }' \
-F 0=@$file.gz; rm -rf $file.gz
`;

  userActivityLogger.user_action(
    `User triggered a Drush SQL Dump task on environment '${environmentId}'`,
    {
      project: '',
      event: 'api:taskDrushSqlDump',
      payload: {
        environment: environmentId
      }
    }
  );

  const taskData = await Helpers(sqlClientPool).addTask({
    name: 'Drush sql-dump',
    environment: environmentId,
    service: 'cli',
    command,
    execute: true
  });

  return taskData;
};

export const taskDrushCacheClear: ResolverFn = async (
  root,
  { environment: environmentId },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await envValidators(sqlClientPool).environmentExists(environmentId);
  await envValidators(sqlClientPool).environmentHasService(
    environmentId,
    'cli'
  );
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('task', `drushCacheClear:${envPerm.environmentType}`, {
    project: envPerm.project
  });

  const command =
    'drupal_version=$(drush status drupal-version --format=list) && \
  if [ ${drupal_version%.*} == "7" ]; then \
    drush cc all; \
  elif [ ${drupal_version%.*.*} -ge "8" ] ; then \
    drush cr; \
  else \
    echo "could not clear cache for found Drupal Version ${drupal_version}"; \
    exit 1; \
  fi';

  userActivityLogger.user_action(
    `User triggered a Drush cache clear task on environment '${environmentId}'`,
    {
      project: '',
      event: 'api:taskDrushCacheClear',
      payload: {
        environment: environmentId
      }
    }
  );

  const taskData = await Helpers(sqlClientPool).addTask({
    name: 'Drush cache-clear',
    environment: environmentId,
    service: 'cli',
    command,
    execute: true
  });

  return taskData;
};

export const taskDrushCron: ResolverFn = async (
  root,
  { environment: environmentId },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await envValidators(sqlClientPool).environmentExists(environmentId);
  await envValidators(sqlClientPool).environmentHasService(
    environmentId,
    'cli'
  );
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('task', `drushCron:${envPerm.environmentType}`, {
    project: envPerm.project
  });

  userActivityLogger.user_action(
    `User triggered a Drush cron task on environment '${environmentId}'`,
    {
      project: '',
      event: 'api:taskDrushCron',
      payload: {
        environment: environmentId
      }
    }
  );

  const taskData = await Helpers(sqlClientPool).addTask({
    name: 'Drush cron',
    environment: environmentId,
    service: 'cli',
    command: `drush cron`,
    execute: true
  });

  return taskData;
};

export const taskDrushSqlSync: ResolverFn = async (
  root,
  {
    sourceEnvironment: sourceEnvironmentId,
    destinationEnvironment: destinationEnvironmentId
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await envValidators(sqlClientPool).environmentExists(sourceEnvironmentId);
  await envValidators(sqlClientPool).environmentExists(
    destinationEnvironmentId
  );
  await envValidators(sqlClientPool).environmentsHaveSameProject([
    sourceEnvironmentId,
    destinationEnvironmentId
  ]);
  await envValidators(sqlClientPool).environmentHasService(
    sourceEnvironmentId,
    'cli'
  );

  const sourceEnvironment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(sourceEnvironmentId);
  const destinationEnvironment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(destinationEnvironmentId);

  await hasPermission(
    'task',
    `drushSqlSync:source:${sourceEnvironment.environmentType}`,
    {
      project: sourceEnvironment.project
    }
  );
  await hasPermission(
    'task',
    `drushSqlSync:destination:${destinationEnvironment.environmentType}`,
    {
      project: destinationEnvironment.project
    }
  );

  userActivityLogger.user_action(
    `User triggered a Drush SQL sync task from '${sourceEnvironmentId}' to '${destinationEnvironmentId}'`,
    {
      project: '',
      event: 'api:taskDrushSqlSync',
      payload: {
        sourceEnvironment: sourceEnvironmentId,
        destinationEnvironment: destinationEnvironmentId
      }
    }
  );

  const taskData = await Helpers(sqlClientPool).addTask({
    name: `Sync DB ${sourceEnvironment.name} -> ${destinationEnvironment.name}`,
    environment: destinationEnvironmentId,
    service: 'cli',
    command: `drush -y sql-sync @${sourceEnvironment.name} @self`,
    execute: true
  });

  return taskData;
};

export const taskDrushRsyncFiles: ResolverFn = async (
  root,
  {
    sourceEnvironment: sourceEnvironmentId,
    destinationEnvironment: destinationEnvironmentId
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await envValidators(sqlClientPool).environmentExists(sourceEnvironmentId);
  await envValidators(sqlClientPool).environmentExists(
    destinationEnvironmentId
  );
  await envValidators(sqlClientPool).environmentsHaveSameProject([
    sourceEnvironmentId,
    destinationEnvironmentId
  ]);
  await envValidators(sqlClientPool).environmentHasService(
    sourceEnvironmentId,
    'cli'
  );

  const sourceEnvironment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(sourceEnvironmentId);
  const destinationEnvironment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(destinationEnvironmentId);

  await hasPermission(
    'task',
    `drushRsync:source:${sourceEnvironment.environmentType}`,
    {
      project: sourceEnvironment.project
    }
  );
  await hasPermission(
    'task',
    `drushRsync:destination:${destinationEnvironment.environmentType}`,
    {
      project: destinationEnvironment.project
    }
  );

  userActivityLogger.user_action(
    `User triggered an rsync sync task from '${sourceEnvironmentId}' to '${destinationEnvironmentId}'`,
    {
      project: '',
      event: 'api:taskDrushRsyncFiles',
      payload: {
        sourceEnvironment: sourceEnvironmentId,
        destinationEnvironment: destinationEnvironmentId
      }
    }
  );

  const taskData = await Helpers(sqlClientPool).addTask({
    name: `Sync files ${sourceEnvironment.name} -> ${destinationEnvironment.name}`,
    environment: destinationEnvironmentId,
    service: 'cli',
    command: `drush -y rsync @${sourceEnvironment.name}:%files @self:%files`,
    execute: true
  });

  return taskData;
};

export const taskDrushUserLogin: ResolverFn = async (
  root,
  { environment: environmentId },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await envValidators(sqlClientPool).environmentExists(environmentId);
  await envValidators(sqlClientPool).environmentHasService(
    environmentId,
    'cli'
  );
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('task', `drushUserLogin:${envPerm.environmentType}`, {
    project: envPerm.project
  });

  userActivityLogger.user_action(
    `User triggered a Drush user login task on '${environmentId}'`,
    {
      project: '',
      event: 'api:taskDrushUserLogin',
      payload: {
        environment: environmentId
      }
    }
  );

  const taskData = await Helpers(sqlClientPool).addTask({
    name: 'Drush uli',
    environment: environmentId,
    service: 'cli',
    command: `drush uli`,
    execute: true
  });

  return taskData;
};

export const taskSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.TASK.ADDED,
  EVENTS.TASK.UPDATED
]);
