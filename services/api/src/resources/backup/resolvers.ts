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
import { Sql } from './sql';
import { Sql as projectSql } from '../project/sql';
import { Sql as environmentSql } from '../environment/sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { AuditType } from '@lagoon/commons/dist/types';
import { AuditLog } from '../audit/types';
import e from 'express';
import { logger } from '../../loggers/logger';

const { S3Client, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// https://{endpoint}/{bucket}/{key}
const s3LinkMatch = /([^/]+)\/([^/]+)\/([^/]+)/;
const awsLinkMatch = /s3\.([^.]+)\.amazonaws\.com\//;

const getS3Client = async (sqlClientPool, projectId, s3Parts, restoreLocation) => {
    let credentials = await getRestoreLocationS3Creds(sqlClientPool, projectId)

    let awsS3Parts;

    if (R.test(awsLinkMatch, restoreLocation)) {
      awsS3Parts = R.match(awsLinkMatch, restoreLocation);
    }

    // We have to generate a new client every time because the endpoint is parsed
    // from the s3 url.
    const URL = require('url').URL;
    const restoreLocationURL = new URL(restoreLocation);
    return new S3Client({
      credentials,
      forcePathStyle: true,
      signatureVersion: 'v4',
      endpoint: `${restoreLocationURL.protocol}//${R.prop(1, s3Parts)}`,
      region: awsS3Parts ? R.prop(1, awsS3Parts) : 'us-east-1'
    });
}

const getRestoreLocationS3Creds = async (sqlClientPool, projectId) => {
  const projectEnvVars = await query(sqlClientPool, Sql.selectEnvVariablesByProjectsById(projectId));
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

  return {accessKeyId, secretAccessKey};
}

const getRestoreLocation = async (backupId, restoreLocation, sqlClientPool, userActivityLogger, restoreSizeOnly = false) => {
  let restoreSize = 0;
  const rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  if (rows.length == 0) {
    return
  }
  const project = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(rows[0].environment);

  if (R.test(s3LinkMatch, restoreLocation)) {
    const s3Parts = R.match(s3LinkMatch, restoreLocation);
    const s3Client = await getS3Client(sqlClientPool, project.projectId, s3Parts, restoreLocation)
    const bucket = R.prop(2, s3Parts)
    const fileKey = R.prop(3, s3Parts)

    try {
      const headObjectResponse = await s3Client.send(new HeadObjectCommand({
        Bucket: bucket,
        Key: fileKey
      }));
      restoreSize = headObjectResponse.ContentLength ?? restoreSize;

      const restLoc = await getSignedUrl(s3Client, new GetObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      }), {
        expiresIn: s3Config.signedLinkExpiration
      });

      if (!restoreSizeOnly) {
        // only log requests if restorelocation is requested
        if (typeof userActivityLogger === 'function') {
          const auditLog: AuditLog = {
            resource: {
              type: AuditType.FILE,
              details: fileKey,
            },
          };
          if (project.organization) {
            auditLog.organizationId = project.organization;
          }
          userActivityLogger(`User requested a download link`, {
            event: 'api:getSignedBackupUrl',
            payload: {
              Bucket: bucket,
              Key: fileKey,
              ...auditLog,
            }
          });
        }
      }

      return {restoreLocation: restLoc, restoreSize};
    } catch(err) {
      await query(
        sqlClientPool,
        Sql.deleteRestore({
          backupId
        })
      );
      return {restoreLocation: "", restoreSize};
    }
  }

  return {restoreLocation, restoreSize};
};

const deleteRestoreLocation = async (backupId, restoreLocation, sqlClientPool) => {
  let restoreSize = 0;
  const rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  if (rows.length == 0) {
    return
  }
  const project = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(rows[0].environment);

  if (R.test(s3LinkMatch, restoreLocation)) {
    const s3Parts = R.match(s3LinkMatch, restoreLocation);
    const s3Client = await getS3Client(sqlClientPool, project.projectId, s3Parts, restoreLocation)
    const bucket = R.prop(2, s3Parts)
    const fileKey = R.prop(3, s3Parts)

    try {
      const headObjectResponse = await s3Client.send(new HeadObjectCommand({
        Bucket: bucket,
        Key: fileKey
      }));
      restoreSize = headObjectResponse.ContentLength ?? restoreSize;

      // delete the object from the bucket
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: fileKey
      }));
    } catch(err) {
      // do nothing
      logger.warn(`failed to check object reference in s3: ${e}`)
    }
    // in any case, if the restore id is correct, delete the restore id
    await query(
      sqlClientPool,
      Sql.deleteRestore({
        backupId
      })
    );
  }
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

  const project = await projectHelpers(sqlClientPool).getProjectById(environment.project);

  pubSub.publish(EVENTS.BACKUP, backup);

  const auditLog: AuditLog = {
    resource: {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
    linkedResource: {
      id: backup.id.toString(),
      type: AuditType.BACKUP,
      details: `${source} - ${backupId}`,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
  userActivityLogger(`User added backup '${backupId}' to '${environment.name}' on project '${environment.project}'`, {
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

  const environment = await query(sqlClientPool, environmentSql.selectEnvironmentBySnapshotId(backupId))
  const project = await projectHelpers(sqlClientPool).getProjectById(environment[0].project);
  const rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  const backup = R.prop(0, rows);
  await query(sqlClientPool, Sql.deleteBackup(backupId));

  const auditLog: AuditLog = {
    resource: {
      id: environment[0].id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment[0].name,
    },
    linkedResource: {
      id: backup.id.toString(),
      type: AuditType.BACKUP,
      details: `${backup.source} - ${backupId}`,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
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
      id: environmentData.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environmentData.name,
    },
    linkedResource: {
      id: backupData.id.toString(),
      type: AuditType.BACKUP,
      details: `${backupData.source} - ${backupId}`,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
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

  const environmentData = await query(sqlClientPool, environmentSql.selectEnvironmentBySnapshotId(backupId))
  const project = await projectHelpers(sqlClientPool).getProjectById(environmentData[0].project);

  pubSub.publish(EVENTS.BACKUP, backupData);

  const auditLog: AuditLog = {
    resource: {
      id: environmentData[0].id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environmentData[0].name,
    },
    linkedResource: {
      id: backupData.id.toString(),
      type: AuditType.BACKUP,
      details: `${backupData.source} - ${backupId}`,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
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


export const deleteRestore: ResolverFn = async (
  root,
  {
    input: {
      backupId,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {

  let rows = await query(sqlClientPool, Sql.selectBackupByBackupId(backupId));
  if (rows.length == 0) {
    throw new Error(
      `Unauthorized: You don't have permission to "delete" on "restore"`
    );
  }
  const backupData = R.prop(0, rows);

  const permsRestore = await query(
    sqlClientPool,
    Sql.selectPermsForRestore(backupId)
  );

  // Check access to modify restore as it currently stands
  await hasPermission('restore', 'delete', {
    project: R.path(['0', 'pid'], permsRestore)
  });

  rows = await query(sqlClientPool, Sql.selectRestoreByBackupId(backupId));
  if (rows.length == 0) {
    throw new Error(
      `No restore file found for backup`
    );
  }
  const restoreData = R.prop(0, rows);

  await deleteRestoreLocation(backupId, restoreData.restoreLocation, sqlClientPool);

  const environmentData = await query(sqlClientPool, environmentSql.selectEnvironmentBySnapshotId(backupId))
  const project = await projectHelpers(sqlClientPool).getProjectById(environmentData[0].project);

  pubSub.publish(EVENTS.BACKUP, backupData);

  const auditLog: AuditLog = {
    resource: {
      id: environmentData[0].id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environmentData[0].name,
    },
    linkedResource: {
      id: backupData.id.toString(),
      type: AuditType.BACKUP,
      details: `${backupData.source} - ${backupId}`,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
  if (userActivityLogger != undefined) {
    userActivityLogger(`User deleted restored file for backup '${backupId}'`, {
      project: '',
      event: 'api:deleteRestore',
      payload: {
        backupId,
        backupData,
        ...auditLog,
      }
    });
  }

  return backupData;
};

export const getBackupDownloadLinkByBackupId: ResolverFn = async (
  root,
  { backupId },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  const perms = await query(sqlClientPool, Sql.selectPermsForBackup(backupId));

  await hasPermission('backup', 'view', {
    project: R.path(['0', 'pid'], perms)
  });

  const rows = await query(
    sqlClientPool,
    Sql.selectRestoreByBackupId(backupId)
  );
  const row = R.prop(0, rows)

  if (!row || row.restoreLocation == null) {
    throw new Error(`no restore file available`);
  }
  const backupData = R.prop(0, rows);
  const restoreLoc = await getRestoreLocation(backupId, backupData.restoreLocation, sqlClientPool, userActivityLogger);
  return restoreLoc.restoreLocation;
}

export const getRestoreByBackupId: ResolverFn = async (
  { backupId },
  args,
  { sqlClientPool, userActivityLogger },
  info
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectRestoreByBackupId(backupId)
  );
  const row = R.prop(0, rows)

  if (!row || row.restoreLocation == null) {
    return row;
  }

  const restoreLocationRequested = info.fieldNodes[0].selectionSet.selections.find(item => item.name.value === "restoreLocation");
  if (restoreLocationRequested) {
    // if the restore has a location, determine the signed url and the reported size of the object in Bytes
    const restoreLoc = await getRestoreLocation(backupId, row.restoreLocation, sqlClientPool, userActivityLogger);
    return {...row, restoreLocation: restoreLoc.restoreLocation, restoreSize: restoreLoc.restoreSize};
  } else {
    // if the restore does not have a location, return the row as is with restoreSize
    const restoreLoc = await getRestoreLocation(backupId, row.restoreLocation, sqlClientPool, userActivityLogger, true);
    return {...row, restoreSize: restoreLoc.restoreSize};
  }
};

export const backupSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.BACKUP
]);
