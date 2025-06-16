import * as R from 'ramda';
import { ResolverFn } from '../';
import { s3Client } from '../../clients/aws';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Sql as taskSql } from '../task/sql';
import { s3Config } from '../../util/config';

// if this is google cloud storage or not
const isGCS = process.env.S3_FILES_GCS || 'false'

export const getDownloadLink: ResolverFn = async ({ s3Key }, input, { userActivityLogger }) => {
  userActivityLogger(`User requested a download link`, {
    event: 'api:getSignedUrl',
    payload: {
      Key: s3Key,
    }
  });
  return s3Client.getSignedUrl('getObject', {
      Key: s3Key,
      Expires: s3Config.signedLinkExpiration,
    });
}


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
    const params = {
      Key: s3_key,
      Body: newFile.createReadStream(),
      ...(isGCS == 'false' && {ACL: 'private'}),
    };
    // @ts-ignore
    await s3Client.upload(params).promise();

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

  const params = {
    Delete: {
      Objects: deleteObjects,
      Quiet: false
    }
  };
  // @ts-ignore
  await s3Client.deleteObjects(params).promise();

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
