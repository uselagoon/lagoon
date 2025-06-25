import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createMiscTask } from '@lagoon/commons/dist/tasks';
import { ResolverFn } from '../';
import { getConfigFromEnv, s3Config } from '../../util/config';
import { query, isPatchEmpty, knex } from '../../util/db';
import {
  pubSub,
  createEnvironmentFilteredSubscriber,
  EVENTS
} from '../../clients/pubSub';
import S3 from 'aws-sdk/clients/s3';
import { Sql } from './sql';
import { Sql as projectSql } from '../project/sql';
import { Sql as environmentSql } from '../environment/sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { AuditType } from '@lagoon/commons/dist/types';
import { AuditLog } from '../audit/types';
import e from 'express';

const getRestoreLocation = async (backupId, restoreLocation, sqlClientPool, userActivityLogger) => {
  let restoreSize = 0;
  const rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  const project = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(rows[0].environment);
  const projectEnvVars = await query(sqlClientPool, Sql.selectEnvVariablesByProjectsById(project.projectId));

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
    const URL = require('url').URL;
    const restoreLocationURL = new URL(restoreLocation);
    const s3Client = new S3({
      accessKeyId,
      secretAccessKey,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      endpoint: `${restoreLocationURL.protocol}//${R.prop(1, s3Parts)}`,
      region: awsS3Parts ? R.prop(1, awsS3Parts) : ''
    });


    // before generating the signed url, check the object exists
    const restoreLoc = await s3Client.headObject({
      Bucket: R.prop(2, s3Parts),
      Key: R.prop(3, s3Parts)
    });
    try {
      const data = await Promise.resolve(restoreLoc.promise());
      restoreSize = data.ContentLength ?? restoreSize
      const restLoc = await s3Client.getSignedUrl('getObject', {
        Bucket: R.prop(2, s3Parts),
        Key: R.prop(3, s3Parts),
        Expires: s3Config.signedLinkExpiration
      })

      if (typeof userActivityLogger === 'function') {
        const auditLog: AuditLog = {
          resource: {
            type: AuditType.FILE,
            details: R.prop(3, s3Parts),
          },
        };
        userActivityLogger(`User requested a download link`, {
          event: 'api:getSignedBackupUrl',
          payload: {
            Bucket: R.prop(2, s3Parts),
            Key: R.prop(3, s3Parts),
            ...auditLog,
          }
        });
      }

      return [restLoc, restoreSize];
    } catch(err) {
      await query(
        sqlClientPool,
        Sql.deleteRestore({
          backupId
        })
      );
      return ["", restoreSize];
    }
  }

  return [restoreLocation, restoreSize];
};

export const getBackupsByEnvironmentId: ResolverFn = async (
  { id: environmentId },
  { limit },
  { sqlClientPool, hasPermission, adminScopes }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    await hasPermission('backup', 'view', {
      project: environment.project
    });
  }

  let queryBuilder = knex('environment_backup')
    .where('environment', environmentId)
    .orderBy('created', 'desc')
    .orderBy('id', 'desc');

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

  let insertId: number;
  try {
     ({insertId} = await query(
      sqlClientPool,
      Sql.insertBackup({
        id,
        environment: environmentId,
        source,
        backupId,
        created
      })
    ));
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error adding backup. Backup already exists.`
      );
    } else {
      throw new Error(error.message);
    }
  };

  const rows = await query(sqlClientPool, Sql.selectBackup(insertId));
  const backup = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP, backup);

  const auditLog: AuditLog = {
    resource: {
      id: environment.id,
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
    linkedResource: {
      id: backup.id,
      type: AuditType.BACKUP,
      details: `${source} - ${backupId}`,
    },
  };
  userActivityLogger(`User deployed backup '${backupId}' to '${environment.name}' on project '${environment.project}'`, {
    project: '',
    event: 'api:addBackup',
    payload: {
      id,
      environment,
      project: environment.project,
      source,
      backupId,
      created,
      ...auditLog,
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

  const environment = await environmentSql.selectEnvironmentByBackupId(backupId)
  const rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  const backup = R.prop(0, rows);
  await query(sqlClientPool, Sql.deleteBackup(backupId));

  const auditLog: AuditLog = {
    resource: {
      id: environment.id,
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
    linkedResource: {
      id: backup.id,
      type: AuditType.BACKUP,
      details: `${backup.source} - ${backupId}`,
    },
  };
  userActivityLogger(`User deleted backup '${backupId}'`, {
    project: '',
    event: 'api:deleteBackup',
    payload: {
      backupId,
      ...auditLog,
    }
  });

  return 'success';
};

export const addRestore: ResolverFn = async (
  root,
  { input: { id, backupId, status, restoreLocation, created, execute } },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  const perms = await query(sqlClientPool, Sql.selectPermsForBackup(backupId));

  if (restoreLocation) {
    if (!adminScopes.platformOwner) {
      // throw unauthorized if not platform
      throw new Error('Unauthorized');
    }
  }
  await hasPermission('restore', 'add', {
    project: R.path(['0', 'pid'], perms)
  });

  let insertId: number;
  try {
     ({insertId} = await query(
      sqlClientPool,
      Sql.insertRestore({
        id,
        backupId,
        status,
        restoreLocation,
        created
      })
    ));
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error adding restore. Restore already exists.`
      );
    } else {
      throw new Error(error.message);
    }
  };

  let rows = await query(sqlClientPool, Sql.selectRestore(insertId));
  const restoreData = R.prop(0, rows);

  rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  const backupData = R.prop(0, rows);

  pubSub.publish(EVENTS.BACKUP, backupData);

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

  const auditLog: AuditLog = {
    resource: {
      id: environmentData.id,
      type: AuditType.ENVIRONMENT,
      details: environmentData.name,
    },
    linkedResource: {
      id: backupData.id,
      type: AuditType.BACKUP,
      details: `${backupData.source} - ${backupId}`,
    },
  };
  userActivityLogger(`User restored a backup '${backupId}' for project ${projectData.name}`, {
    project: '',
    event: 'api:addRestore',
    payload: {
      restoreId: restoreData.id,
      project: projectData.name,
      backupId,
      data,
      ...auditLog,
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
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const permsRestore = await query(
    sqlClientPool,
    Sql.selectPermsForRestore(backupId)
  );

  if (restoreLocation) {
    if (!adminScopes.platformOwner) {
      // throw unauthorized if not platform
      throw new Error('Unauthorized');
    }
  }
  // Check access to modify restore as it currently stands
  await hasPermission('restore', 'update', {
    project: R.path(['0', 'pid'], permsRestore)
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

  const environmentData = await environmentSql.selectEnvironmentByBackupId(backupId)

  pubSub.publish(EVENTS.BACKUP, backupData);

  const auditLog: AuditLog = {
    resource: {
      id: environmentData.id,
      type: AuditType.ENVIRONMENT,
      details: environmentData.name,
    },
    linkedResource: {
      id: backupData.id,
      type: AuditType.BACKUP,
      details: `${backupData.source} - ${backupId}`,
    },
  };
  if (userActivityLogger != undefined) {
    userActivityLogger(`User updated restore '${backupId}'`, {
    project: '',
    event: 'api:updateRestore',
    payload: {
      backupId,
      patch,
      backupData,
      ...auditLog,
    }
  });
  }

  return restoreData;
};

export const getRestoreByBackupId: ResolverFn = async (
  { backupId },
  args,
  { sqlClientPool, userActivityLogger }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectRestoreByBackupId(backupId)
  );
  const row = R.prop(0, rows)
  if (row && row.restoreLocation != null) {
    // if the restore has a location, determine the signed url and the reported size of the object in Bytes
    const [restLoc, restSize] = await getRestoreLocation(backupId, row.restoreLocation, sqlClientPool, userActivityLogger);
    return {...row, restoreLocation: restLoc, restoreSize: restSize};
  }
  return row;
};

export const backupSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.BACKUP
]);
