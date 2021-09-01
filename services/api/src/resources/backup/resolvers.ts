import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createMiscTask } from '@lagoon/commons/dist/tasks';
import { ResolverFn } from '../';
import { getConfigFromEnv } from '../../util/config';
import { query, isPatchEmpty, knex } from '../../util/db';
import {
  pubSub,
  createEnvironmentFilteredSubscriber
} from '../../clients/pubSub';
import S3 from 'aws-sdk/clients/s3';
import { Sql } from './sql';
import { Sql as projectSql } from '../project/sql';
import { Sql as environmentSql } from '../environment/sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { getEnvVarsByProjectId } from '../env-variables/resolvers';
import { EVENTS } from './events';
import { logger } from '../../loggers/logger';

export const getRestoreLocation: ResolverFn = async (
  _root,
  _args,
  _context,
) => {
  const { restoreLocation, backupId } = _root;
  const { sqlClientPool, hasPermission } = _context;
  const rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  const project = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(rows[0].environment);
  const projectEnvVars = await getEnvVarsByProjectId({ id: project.projectId }, _args, _context);

  // https://{endpoint}/{bucket}/{key}
  const s3LinkMatch = /([^/]+)\/([^/]+)\/([^/]+)/;

  if (R.test(s3LinkMatch, restoreLocation)) {
    const s3Parts = R.match(s3LinkMatch, restoreLocation);

    // Handle custom restore configurations
    let lagoonBaasCustomRestoreEndpoint = projectEnvVars.find(obj => {
      return obj.name === "LAGOON_BAAS_CUSTOM_RESTORE_ENDPOINT"
    })
    if (lagoonBaasCustomRestoreEndpoint) {
      lagoonBaasCustomRestoreEndpoint = lagoonBaasCustomRestoreEndpoint.value
    }
    let lagoonBaasCustomRestoreBucket = projectEnvVars.find(obj => {
      return obj.name === "LAGOON_BAAS_CUSTOM_RESTORE_BUCKET"
    })
    if (lagoonBaasCustomRestoreBucket) {
      lagoonBaasCustomRestoreBucket = lagoonBaasCustomRestoreBucket.value
    }
    let lagoonBaasCustomRestoreAccessKey = projectEnvVars.find(obj => {
      return obj.name === "LAGOON_BAAS_CUSTOM_RESTORE_ACCESS_KEY"
    })
    if (lagoonBaasCustomRestoreAccessKey) {
      lagoonBaasCustomRestoreAccessKey = lagoonBaasCustomRestoreAccessKey.value
    }
    let lagoonBaasCustomRestoreSecretKey = projectEnvVars.find(obj => {
      return obj.name === "LAGOON_BAAS_CUSTOM_RESTORE_SECRET_KEY"
    })
    if (lagoonBaasCustomRestoreSecretKey) {
      lagoonBaasCustomRestoreSecretKey = lagoonBaasCustomRestoreSecretKey.value
    }

    let accessKeyId, secretAccessKey
    if (lagoonBaasCustomRestoreEndpoint && lagoonBaasCustomRestoreBucket && lagoonBaasCustomRestoreAccessKey && lagoonBaasCustomRestoreSecretKey) {
      // Custom Restore location exists, use these credentials instead
      accessKeyId = lagoonBaasCustomRestoreAccessKey
      secretAccessKey = lagoonBaasCustomRestoreSecretKey
    } else {
      // No Custom Restore location exists, use default credentials
      accessKeyId = getConfigFromEnv(
        'S3_BAAS_ACCESS_KEY_ID',
        'XXXXXXXXXXXXXXXXXXXX'
      );
      secretAccessKey = getConfigFromEnv(
        'S3_BAAS_SECRET_ACCESS_KEY',
        'XXXXXXXXXXXXXXXXXXXX'
      );
    }

    let awsS3Parts;
    const awsLinkMatch = /s3\.([^.]+)\.amazonaws\.com\//;

    if (R.test(awsLinkMatch, restoreLocation)) {
      awsS3Parts = R.match(awsLinkMatch, restoreLocation);
    }

    // We have to generate a new client every time because the endpoint is parsed
    // from the s3 url.
    const s3Client = new S3({
      accessKeyId,
      secretAccessKey,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      endpoint: `https://${R.prop(1, s3Parts)}`,
      region: awsS3Parts ? R.prop(1, awsS3Parts) : ''
    });

    return s3Client.getSignedUrl('getObject', {
      Bucket: R.prop(2, s3Parts),
      Key: R.prop(3, s3Parts),
      Expires: 300 // 5 minutes
    });
  }

  return restoreLocation;
};

export const getBackupsByEnvironmentId: ResolverFn = async (
  { id: environmentId },
  { includeDeleted, limit },
  { sqlClientPool, hasPermission }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);
  await hasPermission('backup', 'view', {
    project: environment.project
  });

  let queryBuilder = knex('environment_backup')
    .where('environment', environmentId)
    .orderBy('created', 'desc')
    .orderBy('id', 'desc');

  if (!includeDeleted) {
    queryBuilder = queryBuilder.where('deleted', '0000-00-00 00:00:00');
  }

  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  return query(sqlClientPool, queryBuilder.toString());
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

  userActivityLogger.user_action(
    `User deployed backup '${backupId}' to '${environment.name}' on project '${environment.project}'`,
    {
      project: environment.project,
      event: 'api:addBackup',
      payload: {
        id,
        environment,
        source,
        backupId,
        created
      }
    }
  );

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

  const rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  pubSub.publish(EVENTS.BACKUP.DELETED, R.prop(0, rows));

  userActivityLogger.user_action(`User deleted backup '${backupId}'`, {
    project: '',
    event: 'api:deleteBackup',
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
  const restoreData = R.prop(0, rows);

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

  userActivityLogger.user_action(
    `User restored a backup '${backupId}' for project ${projectData.name}`,
    {
      project: projectData.name,
      event: 'api:addRestore',
      payload: {
        restoreId: restoreData.id,
        backupId,
        data
      }
    }
  );

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
  const restoreData = R.prop(0, rows);

  rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  const backupData = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP.UPDATED, backupData);

  userActivityLogger.user_action(`User updated restore '${backupId}'`, {
    project: '',
    event: 'api:updateRestore',
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
  { sqlClientPool }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectRestoreByBackupId(backupId)
  );

  return R.prop(0, rows);
};

export const backupSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.BACKUP.ADDED,
  EVENTS.BACKUP.UPDATED,
  EVENTS.BACKUP.DELETED
]);
