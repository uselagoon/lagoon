import * as R from 'ramda';
import { ResolverFn } from '../';
import { s3Client } from '../../clients/aws';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Sql as taskSql } from '../task/sql';
import { s3Config } from '../../util/config';
import { AuditLog } from '../audit/types';
import { AuditType } from '@lagoon/commons/dist/types';

const { GetObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');

// if this is google cloud storage or not
const isGCS = process.env.S3_FILES_GCS || 'false'
const bucket = process.env.S3_FILES_BUCKET || 'lagoon-files'


export const getDownloadLink: ResolverFn = async ({ s3Key }, input, { userActivityLogger }) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  });

  if (typeof userActivityLogger === 'function') {

    const auditLog: AuditLog = {
      resource: {
        type: AuditType.FILE,
        details: s3Key
      },
    };

    userActivityLogger(`User requested a download link`, {
      event: 'api:getSignedTaskUrl',
      payload: {
        Key: s3Key,
        ...auditLog
      }
    });
  }

  return getSignedUrl(s3Client, command, {
    expiresIn: s3Config.signedLinkExpiration,
  });
};

export const getFilesByTaskId: ResolverFn = async (
  { id: tid },
  _args,
  { sqlClientPool }
) => query(sqlClientPool, Sql.selectTaskFiles(tid));

export const uploadFilesForTask: ResolverFn = async (
  root,
  { input: { task, files } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rowsPerms = await query(
    sqlClientPool,
    taskSql.selectPermsForTask(task)
  );
  const projectId = R.path(['0', 'pid'], rowsPerms);

  await hasPermission('task', 'update', {
    project: projectId
  });

  const resolvedFiles = await Promise.all(files);
  const uploadAndTrackFiles = resolvedFiles.map(async (newFile: any) => {
    const s3_key = `tasks/${task}/${newFile.filename}`;

    const parallelUploads3 = new Upload({
      client: s3Client,
      params: {
        Bucket: bucket,
        Key: s3_key,
        Body: newFile.createReadStream(),
        ...(isGCS == 'false' && { ACL: 'private' }),
      },
    });

    await parallelUploads3.done();

    const { insertId } = await query(
      sqlClientPool,
      Sql.insertFile({
        filename: newFile.filename,
        s3_key,
        created: '2010-01-01 00:00:00'
      })
    );

    await query(
      sqlClientPool,
      Sql.insertFileTask({
        tid: task,
        fid: insertId
      })
    );
  });

  await Promise.all(uploadAndTrackFiles);

  const rows = await query(sqlClientPool, taskSql.selectTask(task));
  task = R.prop(0, rows);

  userActivityLogger(`User uploaded files for task '${task.id}' on project '${projectId}'`,
    {
      project: '',
      event: 'api:uploadFilesForTask',
      payload: {
        task
      }
    }
  );

  return task;
};

export const deleteFilesForTask: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rowsPerms = await query(sqlClientPool, taskSql.selectPermsForTask(id));

  await hasPermission('task', 'delete', {
    project: R.path(['0', 'pid'], rowsPerms)
  });

  const rows = await query(sqlClientPool, Sql.selectTaskFiles(id));
  const deleteObjects = R.map((file: any) => ({ Key: file.s3Key }), rows);

  const command = new DeleteObjectsCommand({
    Bucket: process.env.S3_BUCKET,
    Delete: {
      Objects: deleteObjects,
      Quiet: false
    }
  });

  await s3Client.send(command);

  await query(sqlClientPool, Sql.deleteFileTask(id));

  userActivityLogger(`User deleted files for task '${id}'`, {
    project: '',
    event: 'api:deleteFilesForTask',
    payload: {
      id
    }
  });

  return 'success';
};
