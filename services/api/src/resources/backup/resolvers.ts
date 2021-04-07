import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createMiscTask } from '@lagoon/commons/dist/tasks';
import { ResolverFn } from '../';
import { query, isPatchEmpty } from '../../util/db';
import {
  pubSub,
  createEnvironmentFilteredSubscriber,
} from '../../clients/pubSub';
import { Sql } from './sql';
import Helpers from './helpers';
import { Sql as projectSql } from '../project/sql';
import { Sql as environmentSql } from '../environment/sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import EVENTS from './events';
const userActivityLogger = require('../../loggers/userActivityLogger');

const restoreStatusTypeToString = R.cond([
  [R.equals('PENDING'), R.toLower],
  [R.equals('SUCCESSFUL'), R.toLower],
  [R.equals('FAILED'), R.toLower],
  [R.T, R.identity],
]);

export const getBackupsByEnvironmentId: ResolverFn = async (
  { id: environmentId },
  { includeDeleted },
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);
  await hasPermission('backup', 'view', {
    project: environment.project,
  });

  const rows = await query(
    sqlClient,
    Sql.selectBackupsByEnvironmentId({ environmentId, includeDeleted }),
  );

  const newestFirst = R.sort(R.descend(R.prop('created')), rows);

  return newestFirst;
};

export const addBackup: ResolverFn = async (
  root,
  {
    input: {
      id, environment: environmentId, source, backupId, created,
    },
  },
  { sqlClient, hasPermission, keycloakGrant, requestHeaders },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);
  await hasPermission('backup', 'add', {
    project: environment.project,
  });

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertBackup({
      id,
      environment: environmentId,
      source,
      backupId,
      created,
    }),
  );
  const rows = await query(sqlClient, Sql.selectBackup(insertId));
  const backup = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP.ADDED, backup);

  userActivityLogger.user_action(`User deployed backup '${backupId}' to '${environment.name}' on project '${environment.project}'`, {
    user: keycloakGrant,
    headers: requestHeaders,
    payload: {
      id, environment, source, backupId, created
    }
  });

  return backup;
};

export const deleteBackup: ResolverFn = async (
  root,
  { input: { backupId } },
  {
    sqlClient,
    hasPermission,
    keycloakGrant,
    requestHeaders
  },
) => {
  const perms = await query(sqlClient, Sql.selectPermsForBackup(backupId));
  const pid = R.path(['0', 'pid'], perms);
  await hasPermission('backup', 'delete', {
    project: pid,
  });

  await query(sqlClient, Sql.deleteBackup(backupId));

  const rows = await query(sqlClient, Sql.selectBackupByBackupId(backupId));
  pubSub.publish(EVENTS.BACKUP.DELETED, R.prop(0, rows));

  userActivityLogger.user_action(`User deleted backup '${backupId}' for project ${pid}`, {
    user: keycloakGrant,
    headers: requestHeaders,
    payload: {
     backupId,
     project: pid
    }
  });

  return 'success';
};

export const deleteAllBackups: ResolverFn = async (
  root,
  args,
  { sqlClient, hasPermission, keycloakGrant, requestHeaders },
) => {
  await hasPermission('backup', 'deleteAll');

  await query(sqlClient, Sql.truncateBackup());

  userActivityLogger.user_action(`User deleted all backups`, {
    user: keycloakGrant,
    headers: requestHeaders
  });

  // TODO: Check rows for success
  return 'success';
};

export const addRestore: ResolverFn = async (
  root,
  {
    input: {
      id,
      backupId,
      status: unformattedStatus,
      restoreLocation,
      created,
      execute,
    },
  },
  { sqlClient, hasPermission, keycloakGrant, requestHeaders },
) => {
  const perms = await query(sqlClient, Sql.selectPermsForBackup(backupId));

  await hasPermission('restore', 'add', {
    project: R.path(['0', 'pid'], perms),
  });

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
  const restoreData = await Helpers.makeS3TempLink(R.prop(0, rows));

  rows = await query(sqlClient, Sql.selectBackupByBackupId(backupId));
  const backupData = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP.UPDATED, backupData);

  // Allow creating restore data w/o executing the restore
  if (execute === false) {
    try {
      await hasPermission('restore', 'addNoExec', {
        project: R.path(['0', 'pid'], perms),
      });
      return restoreData;
    } catch (err) {
      // Not allowed to stop execution.
    }
  }

  rows = await query(
    sqlClient,
    environmentSql.selectEnvironmentById(backupData.environment),
  );
  const environmentData = R.prop(0, rows);

  rows = await query(
    sqlClient,
    projectSql.selectProject(environmentData.project),
  );
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

  userActivityLogger.user_action(`User restored backup '${backupId}' for project ${projectData.project.name}`, {
    user: keycloakGrant,
    headers: requestHeaders,
    payload: {
      backupId,
      data
    }
  });

  return restoreData;
};

export const updateRestore: ResolverFn = async (
  root,
  {
    input: {
      backupId,
      patch,
      patch: { status: unformattedStatus, created, restoreLocation },
    },
  },
  {
    sqlClient,
    hasPermission,
    keycloakGrant,
    requestHeaders
  },
) => {
  const status = restoreStatusTypeToString(unformattedStatus);

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const permsRestore = await query(sqlClient, Sql.selectPermsForRestore(backupId));
  const permsBackup = await query(sqlClient, Sql.selectPermsForBackup(backupId));

  // Check access to modify restore as it currently stands
  await hasPermission('restore', 'update', {
    project: R.path(['0', 'pid'], permsRestore),
  });
  // Check access to modify restore as it will be updated
  await hasPermission('backup', 'view', {
    project: R.path(['0', 'pid'], permsBackup),
  });

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
  const restoreData = Helpers.makeS3TempLink(R.prop(0, rows));

  rows = await query(sqlClient, Sql.selectBackupByBackupId(backupId));
  const backupData = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP.UPDATED, backupData);

  userActivityLogger.user_action(`User updated restore '${backupId}'`, {
    user: keycloakGrant,
    headers: requestHeaders,
    payload: {
      backupId,
      patch,
      backupData
    }
  });

  return restoreData;
};

export const getRestoreByBackupId: ResolverFn = async ({ backupId }, args, { sqlClient, hasPermission }) => {
  const permsBackup = await query(sqlClient, Sql.selectPermsForBackup(backupId));

  await hasPermission('backup', 'view', {
    project: R.path(['0', 'pid'], permsBackup),
  });

  const rows = await query(sqlClient, Sql.selectRestoreByBackupId(backupId));

  return Helpers.makeS3TempLink(R.prop(0, rows));
};

export const backupSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.BACKUP.ADDED,
  EVENTS.BACKUP.UPDATED,
  EVENTS.BACKUP.DELETED,
]);
