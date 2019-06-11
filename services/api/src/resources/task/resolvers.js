// @flow

const R = require('ramda');
const getFieldNames = require('graphql-list-fields');
const {
  pubSub,
  createEnvironmentFilteredSubscriber,
} = require('../../clients/pubSub');
const {
  knex,
  ifNotAdmin,
  inClauseOr,
  prepare,
  query,
  isPatchEmpty,
} = require('../../util/db');
const Sql = require('./sql');
const EVENTS = require('./events');
const Helpers = require('./helpers');
const environmentHelpers = require('../environment/helpers');
const envValidators = require('../environment/validators');

/* ::

import type {ResolversObj} from '../';

*/

const taskStatusTypeToString = R.cond([
  [R.equals('ACTIVE'), R.toLower],
  [R.equals('SUCCEEDED'), R.toLower],
  [R.equals('FAILED'), R.toLower],
  [R.T, R.identity],
]);

const getTasksByEnvironmentId = async (
  { id: eid },
  { id: filterId },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
    sqlClient,
  },
  info,
) => {
  const prep = prepare(
    sqlClient,
    `SELECT
        t.*
      FROM environment e
      JOIN task t on e.id = t.environment
      JOIN project p ON e.project = p.id
      WHERE e.id = :eid
      ${ifNotAdmin(
    role,
    `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
  )}
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));
  const newestFirst = R.sort(R.descend(R.prop('created')), rows);

  const requestedFields = getFieldNames(info);

  return newestFirst
    .filter(row => {
      if (R.isNil(filterId) || R.isEmpty(filterId)) {
        return true;
      }

      return row.id === String(filterId);
    })
    .map(row => {
      if (R.contains('logs', requestedFields)) {
        return Helpers(sqlClient).injectLogs(row);
      }

      return {
        ...row,
        logs: null,
      };
    });
};

const getTaskByRemoteId = async (
  root,
  { id },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
    sqlClient,
  },
) => {
  const queryString = knex('task')
    .where('remote_id', '=', id)
    .toString();

  const rows = await query(sqlClient, queryString);
  const task = R.prop(0, rows);

  if (!task) {
    return null;
  }

  if (role !== 'admin') {
    const rowsPerms = await query(sqlClient, Sql.selectPermsForTask(task.id));

    if (
      !R.contains(R.path(['0', 'pid'], rowsPerms), projects) &&
      !R.contains(R.path(['0', 'cid'], rowsPerms), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  return Helpers(sqlClient).injectLogs(task);
};

const addTask = async (
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
      command,
      remoteId,
      execute: executeRequest,
    },
  },
  { credentials: { role }, sqlClient, hasPermission },
) => {
  const status = taskStatusTypeToString(unformattedStatus);
  const execute = role === 'admin' ? executeRequest : true;

  await envValidators(sqlClient).environmentExists(environment);
  await envValidators(sqlClient).userAccessEnvironment(
    hasPermission,
    environment,
  );

  const taskData = await Helpers(sqlClient).addTask({
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
  });

  return taskData;
};

const deleteTask = async (
  root,
  { input: { id } },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
    sqlClient,
  },
) => {
  if (role !== 'admin') {
    const rows = await query(sqlClient, Sql.selectPermsForTask(id));

    if (
      !R.contains(R.path(['0', 'pid'], rows), projects) &&
      !R.contains(R.path(['0', 'cid'], rows), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  await query(sqlClient, Sql.deleteTask(id));

  return 'success';
};

const updateTask = async (
  root,
  {
    input: {
      id,
      patch,
      patch: {
        name,
        status: unformattedStatus,
        created,
        started,
        completed,
        environment,
        service,
        command,
        remoteId,
      },
    },
  },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
    sqlClient,
    hasPermission,
  },
) => {
  const status = taskStatusTypeToString(unformattedStatus);

  // Check access to modify task as it currently stands
  if (role !== 'admin') {
    const rowsCurrent = await query(sqlClient, Sql.selectPermsForTask(id));

    if (
      !R.contains(R.path(['0', 'pid'], rowsCurrent), projects) &&
      !R.contains(R.path(['0', 'cid'], rowsCurrent), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  // Check access to modify task as it will be updated
  await envValidators(sqlClient).userAccessEnvironment(
    hasPermission,
    environment,
  );

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  await query(
    sqlClient,
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
        remoteId,
      },
    }),
  );

  const rows = await query(sqlClient, Sql.selectTask(id));
  const taskData = await Helpers(sqlClient).injectLogs(R.prop(0, rows));

  pubSub.publish(EVENTS.TASK.UPDATED, taskData);

  return taskData;
};

const taskDrushArchiveDump = async (
  root,
  { environment: environmentId },
  { sqlClient, hasPermission },
) => {
  await envValidators(sqlClient).environmentExists(environmentId);
  await envValidators(sqlClient).userAccessEnvironment(
    hasPermission,
    environmentId,
  );
  await envValidators(sqlClient).environmentHasService(environmentId, 'cli');

  const command = String.raw`file="/tmp/$LAGOON_SAFE_PROJECT-$LAGOON_GIT_SAFE_BRANCH-$(date --iso-8601=seconds).tar" && drush ard --destination=$file && \
curl -sS "$TASK_API_HOST"/graphql \
-H "Authorization: Bearer $TASK_API_AUTH" \
-F operations='{ "query": "mutation ($task: Int!, $files: [Upload!]!) { uploadFilesForTask(input:{task:$task, files:$files}) { id files { filename } } }", "variables": { "task": '"$TASK_DATA_ID"', "files": [null] } }' \
-F map='{ "0": ["variables.files.0"] }' \
-F 0=@$file; rm -rf $file;
`;

  const taskData = await Helpers(sqlClient).addTask({
    name: 'Drush archive-dump',
    environment: environmentId,
    service: 'cli',
    command,
    execute: true,
  });

  return taskData;
};

const taskDrushSqlDump = async (
  root,
  { environment: environmentId },
  { sqlClient, hasPermission },
) => {
  await envValidators(sqlClient).environmentExists(environmentId);
  await envValidators(sqlClient).userAccessEnvironment(
    hasPermission,
    environmentId,
  );
  await envValidators(sqlClient).environmentHasService(environmentId, 'cli');

  const command = String.raw`file="/tmp/$LAGOON_SAFE_PROJECT-$LAGOON_GIT_SAFE_BRANCH-$(date --iso-8601=seconds).sql" && drush sql-dump --result-file=$file --gzip && \
curl -sS "$TASK_API_HOST"/graphql \
-H "Authorization: Bearer $TASK_API_AUTH" \
-F operations='{ "query": "mutation ($task: Int!, $files: [Upload!]!) { uploadFilesForTask(input:{task:$task, files:$files}) { id files { filename } } }", "variables": { "task": '"$TASK_DATA_ID"', "files": [null] } }' \
-F map='{ "0": ["variables.files.0"] }' \
-F 0=@$file.gz; rm -rf $file.gz
`;

  const taskData = await Helpers(sqlClient).addTask({
    name: 'Drush sql-dump',
    environment: environmentId,
    service: 'cli',
    command,
    execute: true,
  });

  return taskData;
};

const taskDrushCacheClear = async (
  root,
  { environment: environmentId },
  { sqlClient, hasPermission },
) => {
  await envValidators(sqlClient).environmentExists(environmentId);
  await envValidators(sqlClient).userAccessEnvironment(
    hasPermission,
    environmentId,
  );
  await envValidators(sqlClient).environmentHasService(environmentId, 'cli');

  const command =
    'drupal_version=$(drush status drupal-version --format=list) && \
  if [ ${drupal_version%.*.*} == "8" ]; then \
    drush cr; \
  elif [ ${drupal_version%.*} == "7" ]; then \
    drush cc all; \
  else \
    echo "could not clear cache for found Drupal Version ${drupal_version}"; \
    exit 1; \
  fi';

  const taskData = await Helpers(sqlClient).addTask({
    name: 'Drush cache-clear',
    environment: environmentId,
    service: 'cli',
    command,
    execute: true,
  });

  return taskData;
};

const taskDrushSqlSync = async (
  root,
  {
    sourceEnvironment: sourceEnvironmentId,
    destinationEnvironment: destinationEnvironmentId,
  },
  { sqlClient, hasPermission },
) => {
  await envValidators(sqlClient).environmentExists(sourceEnvironmentId);
  await envValidators(sqlClient).environmentExists(destinationEnvironmentId);
  await envValidators(sqlClient).environmentsHaveSameProject([
    sourceEnvironmentId,
    destinationEnvironmentId,
  ]);
  await envValidators(sqlClient).userAccessEnvironment(
    hasPermission,
    sourceEnvironmentId,
  );
  await envValidators(sqlClient).userAccessEnvironment(
    hasPermission,
    destinationEnvironmentId,
  );
  await envValidators(sqlClient).environmentHasService(
    sourceEnvironmentId,
    'cli',
  );

  const sourceEnvironment = await environmentHelpers(
    sqlClient,
  ).getEnvironmentById(sourceEnvironmentId);
  const destinationEnvironment = await environmentHelpers(
    sqlClient,
  ).getEnvironmentById(destinationEnvironmentId);

  const taskData = await Helpers(sqlClient).addTask({
    name: `Sync DB ${sourceEnvironment.name} -> ${destinationEnvironment.name}`,
    environment: destinationEnvironmentId,
    service: 'cli',
    command: `drush -y sql-sync @${sourceEnvironment.name} @self`,
    execute: true,
  });

  return taskData;
};

const taskDrushRsyncFiles = async (
  root,
  {
    sourceEnvironment: sourceEnvironmentId,
    destinationEnvironment: destinationEnvironmentId,
  },
  { sqlClient, hasPermission },
) => {
  await envValidators(sqlClient).environmentExists(sourceEnvironmentId);
  await envValidators(sqlClient).environmentExists(destinationEnvironmentId);
  await envValidators(sqlClient).environmentsHaveSameProject([
    sourceEnvironmentId,
    destinationEnvironmentId,
  ]);
  await envValidators(sqlClient).userAccessEnvironment(
    hasPermission,
    sourceEnvironmentId,
  );
  await envValidators(sqlClient).userAccessEnvironment(
    hasPermission,
    destinationEnvironmentId,
  );
  await envValidators(sqlClient).environmentHasService(
    sourceEnvironmentId,
    'cli',
  );

  const sourceEnvironment = await environmentHelpers(
    sqlClient,
  ).getEnvironmentById(sourceEnvironmentId);
  const destinationEnvironment = await environmentHelpers(
    sqlClient,
  ).getEnvironmentById(destinationEnvironmentId);

  const taskData = await Helpers(sqlClient).addTask({
    name: `Sync files ${sourceEnvironment.name} -> ${
      destinationEnvironment.name
    }`,
    environment: destinationEnvironmentId,
    service: 'cli',
    command: `drush -y rsync @${sourceEnvironment.name}:%files @self:%files`,
    execute: true,
  });

  return taskData;
};

const taskSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.TASK.ADDED,
  EVENTS.TASK.UPDATED,
]);

const Resolvers /* : ResolversObj */ = {
  getTasksByEnvironmentId,
  getTaskByRemoteId,
  addTask,
  deleteTask,
  updateTask,
  taskDrushArchiveDump,
  taskDrushSqlDump,
  taskDrushCacheClear,
  taskDrushSqlSync,
  taskDrushRsyncFiles,
  taskSubscriber,
};

module.exports = Resolvers;
