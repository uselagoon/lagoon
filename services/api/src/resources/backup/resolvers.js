// @flow

const R = require('ramda');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { createMiscTask } = require('@lagoon/commons/src/tasks');
const { query, isPatchEmpty } = require('../../util/db');
const sqlClient = require('../../clients/sqlClient');
const Sql = require('./sql');
const projectSql = require('../project/sql');
const environmentSql = require('../environment/sql');

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
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const rows = await query(
    sqlClient,
    Sql.selectBackupsByEnvironmentId({ environmentId }),
  );
  return rows;
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
  return R.prop(0, rows);
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
      id, backup, status: unformattedStatus, restoreLocation, created, execute,
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
      backup,
      status,
      restoreLocation,
      created,
    }),
  );
  let rows = await query(sqlClient, Sql.selectRestore(insertId));
  const restoreData = R.prop(0, rows);

  // Allow creating restore data w/o executing the restore
  if (role === 'admin' && execute === false) {
    return restoreData;
  }

  rows = await query(sqlClient, Sql.selectBackup(backup));
  const backupData = R.prop(0, rows);

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
      { restoreId: restoreData.id, backupId: backupData.id },
      `Restore not initiated, reason: ${error}`,
    );
  }

  return restoreData;
};

const updateRestore = async (
  root,
  {
    input: {
      id,
      patch,
      patch: {
        status: unformattedStatus,
        created,
        backup,
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
    const rowsCurrent = await query(sqlClient, Sql.selectPermsForRestore(id));

    if (
      !R.contains(R.path(['0', 'pid'], rowsCurrent), projects) &&
      !R.contains(R.path(['0', 'cid'], rowsCurrent), customers)
    ) {
      throw new Error('Unauthorized.');
    }

    // Check access to modify restor as it will be updated
    const rowsNew = await query(
      sqlClient,
      Sql.selectPermsForBackup(backup),
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
      id,
      patch: {
        status,
        created,
        backup,
        restoreLocation,
      },
    }),
  );

  const rows = await query(sqlClient, Sql.selectRestore(id));

  return R.prop(0, rows);
};

// Data protected by environment auth
const getRestoresByBackupId = async (
  { id: backupId },
) => {
  const rows = await query(
    sqlClient,
    Sql.selectRestoresByBackupId(backupId),
  );
  return rows;
};

const Resolvers /* : ResolversObj */ = {
  addBackup,
  getBackupsByEnvironmentId,
  deleteAllBackups,
  addRestore,
  getRestoresByBackupId,
  updateRestore,
};

module.exports = Resolvers;
