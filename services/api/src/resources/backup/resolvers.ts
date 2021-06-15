import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createMiscTask } from '@lagoon/commons/dist/tasks';
import { ResolverFn } from '../';
import { query, isPatchEmpty } from '../../util/db';
import {
  pubSub,
  createEnvironmentFilteredSubscriber
} from '../../clients/pubSub';
import { Sql } from './sql';
import { Helpers } from './helpers';
import { Sql as projectSql } from '../project/sql';
import { Sql as environmentSql } from '../environment/sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { EVENTS } from './events';

export const getBackupsByEnvironmentId: ResolverFn = async (
  { id: environmentId },
  { includeDeleted },
  { sqlClientPool, hasPermission }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);
  await hasPermission('backup', 'view', {
    project: environment.project
  });

  const rows = await query(
    sqlClientPool,
    Sql.selectBackupsByEnvironmentId({ environmentId, includeDeleted })
  );

  const newestFirst = R.sort(R.descend(R.prop('created')), rows);

  return newestFirst;
};

export const addBackup: ResolverFn = async (
  root,
  { input: { id, environment: environmentId, source, backupId, created } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);
  await hasPermission('backup', 'add', {
    project: environment.project
  });

  const { insertId } = await query(
    sqlClientPool,
    Sql.insertBackup({
      id,
      environment: environmentId,
      source,
      backupId,
      created
    })
  );
  const rows = await query(sqlClientPool, Sql.selectBackup(insertId));
  const backup = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP.ADDED, backup);

  userActivityLogger.user_action(`User deployed backup '${backupId}' to '${environment.name}' on project '${environment.project}'`, {
    payload: {
      id, environment, source, backupId, created
    }
  });

  return backup;
};

export const deleteBackup: ResolverFn = async (
  root,
  { input: { backupId } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const perms = await query(sqlClientPool, Sql.selectPermsForBackup(backupId));

  await hasPermission('backup', 'delete', {
    project: R.path(['0', 'pid'], perms)
  });

  await query(sqlClientPool, Sql.deleteBackup(backupId));

  const rows = await query(
    sqlClientPool,
    Sql.selectBackupByBackupId(backupId)
  );
  pubSub.publish(EVENTS.BACKUP.DELETED, R.prop(0, rows));

  userActivityLogger.user_action(`User deleted backup '${backupId}'`, {
    payload: {
     backupId
    }
  });

  return 'success';
};

export const deleteAllBackups: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('backup', 'deleteAll');

  await query(sqlClientPool, Sql.truncateBackup());

  userActivityLogger.user_action(`User deleted all backups`);

  // TODO: Check rows for success
  return 'success';
};

export const addRestore: ResolverFn = async (
  root,
  { input: { id, backupId, status, restoreLocation, created, execute } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const perms = await query(sqlClientPool, Sql.selectPermsForBackup(backupId));

  await hasPermission('restore', 'add', {
    project: R.path(['0', 'pid'], perms)
  });

  const { insertId } = await query(
    sqlClientPool,
    Sql.insertRestore({
      id,
      backupId,
      status,
      restoreLocation,
      created
    })
  );
  let rows = await query(sqlClientPool, Sql.selectRestore(insertId));
  const restoreData = await Helpers.makeS3TempLink(R.prop(0, rows));

  rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  const backupData = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP.UPDATED, backupData);

  // Allow creating restore data w/o executing the restore
  if (execute === false) {
    try {
      await hasPermission('restore', 'addNoExec', {
        project: R.path(['0', 'pid'], perms)
      });
      return restoreData;
    } catch (err) {
      // Not allowed to stop execution.
    }
  }

  rows = await query(
    sqlClientPool,
    environmentSql.selectEnvironmentById(backupData.environment)
  );
  const environmentData = R.prop(0, rows);

  rows = await query(
    sqlClientPool,
    projectSql.selectProject(environmentData.project)
  );
  const projectData = R.prop(0, rows);

  const data = {
    backup: backupData,
    restore: restoreData,
    environment: environmentData,
    project: projectData
  };

  userActivityLogger.user_action(`User restored a backup '${backupId}' for project ${projectData.project.name}`, {
    payload: {
      backupId,
      data
    }
  });

  try {
    await createMiscTask({ key: 'restic:backup:restore', data });
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:addRestore',
      { restoreId: restoreData.id, backupId },
      `Restore not initiated, reason: ${error}`
    );
  }

  return restoreData;
};

export const updateRestore: ResolverFn = async (
  root,
  {
    input: {
      backupId,
      patch,
      patch: { status, created, restoreLocation }
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const permsRestore = await query(
    sqlClientPool,
    Sql.selectPermsForRestore(backupId)
  );
  const permsBackup = await query(
    sqlClientPool,
    Sql.selectPermsForBackup(backupId)
  );

  // Check access to modify restore as it currently stands
  await hasPermission('restore', 'update', {
    project: R.path(['0', 'pid'], permsRestore)
  });
  // Check access to modify restore as it will be updated
  await hasPermission('backup', 'view', {
    project: R.path(['0', 'pid'], permsBackup)
  });

  await query(
    sqlClientPool,
    Sql.updateRestore({
      backupId,
      patch: {
        status,
        created,
        restoreLocation
      }
    })
  );

  let rows = await query(sqlClientPool, Sql.selectRestoreByBackupId(backupId));
  const restoreData = Helpers.makeS3TempLink(R.prop(0, rows));

  rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  const backupData = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP.UPDATED, backupData);

  userActivityLogger.user_action(`User updated restore '${backupId}'`, {
    payload: {
      backupId,
      patch,
      backupData
    }
  });

  return restoreData;
};

export const getRestoreByBackupId: ResolverFn = async (
  { backupId },
  args,
  { sqlClientPool, hasPermission }
) => {
  const permsBackup = await query(
    sqlClientPool,
    Sql.selectPermsForBackup(backupId)
  );

  await hasPermission('backup', 'view', {
    project: R.path(['0', 'pid'], permsBackup)
  });

  const rows = await query(
    sqlClientPool,
    Sql.selectRestoreByBackupId(backupId)
  );

  return Helpers.makeS3TempLink(R.prop(0, rows));
};

export const backupSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.BACKUP.ADDED,
  EVENTS.BACKUP.UPDATED,
  EVENTS.BACKUP.DELETED
]);
