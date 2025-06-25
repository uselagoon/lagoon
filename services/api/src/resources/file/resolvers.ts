import * as R from 'ramda';
import { ResolverFn } from '../';
import { s3Client } from '../../clients/aws';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Sql as taskSql } from '../task/sql';
const { GetObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');

// if this is google cloud storage or not
const isGCS = process.env.S3_FILES_GCS || 'false'
const bucket = process.env.S3_FILES_BUCKET || 'lagoon-files'


export const getDownloadLink: ResolverFn = async ({ s3Key }) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: 300, // 5 minutes
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

  await hasPermission('task', 'update', {
    project: R.path(['0', 'pid'], rowsPerms)
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

  userActivityLogger(`User uploaded files for task '${task}' on project
      '${R.path(
      ['0', 'pid'],
      rowsPerms
    )}'`,
    {
      project: '',
      event: 'api:uploadFilesForTask',
      data: {
        rows
      }
    }
  );

  return R.prop(0, rows);
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
    data: {
      id
    }
  });

  return 'success';
};
