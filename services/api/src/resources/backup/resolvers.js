// @flow

const R = require('ramda');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { createMiscTask } = require('@lagoon/commons/src/tasks');
const { query, isPatchEmpty } = require('../../util/db');
const { pubSub, createEnvironmentFilteredSubscriber } = require('../../clients/pubSub');
const sqlClient = require('../../clients/sqlClient');
const Sql = require('./sql');
const projectSql = require('../project/sql');
const environmentSql = require('../environment/sql');
const EVENTS = require('./events');

/* ::

import type {ResolversObj} from '../';

*/

const restoreStatusTypeToString = R.cond([
  [R.equals('PENDING'), R.toLower],
  [R.equals('SUCCESSFUL'), R.toLower],
  [R.equals('FAILED'), R.toLower],
  [R.T, R.identity],
]);

const getBackupsByEnvironmentId = async (
  { id: environmentId },
  { includeDeleted },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const rows = await query(
    sqlClient,
    Sql.selectBackupsByEnvironmentId({ environmentId, includeDeleted }),
  );

  const newestFirst = R.sort(R.descend(R.prop('created')), rows);

  return newestFirst;
};

const addBackup = async (
  root,
  {
    input: {
      id, environment, source, backupId, created,
    },
  },
) => {
  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertBackup({
      id,
      environment,
      source,
      backupId,
      created,
    }),
  );
  const rows = await query(sqlClient, Sql.selectBackup(insertId));
  const backup = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP.ADDED, backup);

  return backup;
};

const deleteBackup = async (
  root,
  { input: { backupId } },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  if (role !== 'admin') {
    const rows = await query(sqlClient, Sql.selectPermsForBackup(backupId));

    if (
      !R.contains(R.path(['0', 'pid'], rows), projects) &&
      !R.contains(R.path(['0', 'cid'], rows), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  await query(sqlClient, Sql.deleteBackup(backupId));

  const rows = await query(sqlClient, Sql.selectBackupByBackupId(backupId));
  pubSub.publish(EVENTS.BACKUP.DELETED, R.prop(0, rows));

  return 'success';
};

const deleteAllBackups = async (root, args, { credentials: { role } }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateBackup());

  // TODO: Check rows for success
  return 'success';
};

const addRestore = async (
  root,
  {
    input: {
      id, backupId, status: unformattedStatus, restoreLocation, created, execute,
    },
  },
  {
    credentials: {
      role,
    },
  }
) => {
  const status = restoreStatusTypeToString(unformattedStatus);
  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertRestore({
      id,
      backupId,
      status,
      restoreLocation,
      created,
    }),
  );
  let rows = await query(sqlClient, Sql.selectRestore(insertId));
  const restoreData = R.prop(0, rows);

  rows = await query(sqlClient, Sql.selectBackupByBackupId(backupId));
  const backupData = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP.UPDATED, backupData);

  // Allow creating restore data w/o executing the restore
  if (role === 'admin' && execute === false) {
    return restoreData;
  }

  rows = await query(sqlClient, environmentSql.selectEnvironmentById(backupData.environment));
  const environmentData = R.prop(0, rows);

  rows = await query(sqlClient, projectSql.selectProject(environmentData.project));
  const projectData = R.prop(0, rows);

  const data = {
    backup: backupData,
    restore: restoreData,
    environment: environmentData,
    project: projectData,
  };

  try {
    await createMiscTask({ key: 'restic:backup:restore', data });
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:addRestore',
      { restoreId: restoreData.id, backupId },
      `Restore not initiated, reason: ${error}`,
    );
  }

  return restoreData;
};

const updateRestore = async (
  root,
  {
    input: {
      backupId,
      patch,
      patch: {
        status: unformattedStatus,
        created,
        restoreLocation,
      },
    },
  },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const status = restoreStatusTypeToString(unformattedStatus);

  if (role !== 'admin') {
    // Check access to modify restore as it currently stands
    const rowsCurrent = await query(sqlClient, Sql.selectPermsForRestore(backupId));

    if (
      !R.contains(R.path(['0', 'pid'], rowsCurrent), projects) &&
      !R.contains(R.path(['0', 'cid'], rowsCurrent), customers)
    ) {
      throw new Error('Unauthorized.');
    }

    // Check access to modify restor as it will be updated
    const rowsNew = await query(
      sqlClient,
      Sql.selectPermsForBackup(backupId),
    );

    if (
      !R.contains(R.path(['0', 'pid'], rowsNew), projects) &&
      !R.contains(R.path(['0', 'cid'], rowsNew), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  await query(
    sqlClient,
    Sql.updateRestore({
      backupId,
      patch: {
        status,
        created,
        restoreLocation,
      },
    }),
  );

  let rows = await query(sqlClient, Sql.selectRestoreByBackupId(backupId));
  const restoreData = R.prop(0, rows);

  rows = await query(sqlClient, Sql.selectBackupByBackupId(backupId));
  const backupData = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP.UPDATED, backupData);

  return restoreData;
};

// Data protected by environment auth
const getRestoreByBackupId = async (
  { backupId },
) => {
  const rows = await query(
    sqlClient,
    Sql.selectRestoreByBackupId(backupId),
  );
  return R.prop(0, rows);
};

const backupSubscriber = createEnvironmentFilteredSubscriber(
  [
    EVENTS.BACKUP.ADDED,
    EVENTS.BACKUP.UPDATED,
    EVENTS.BACKUP.DELETED,
  ]
);

const Resolvers /* : ResolversObj */ = {
  addBackup,
  getBackupsByEnvironmentId,
  deleteBackup,
  deleteAllBackups,
  addRestore,
  getRestoreByBackupId,
  updateRestore,
  backupSubscriber,
};

module.exports = Resolvers;
