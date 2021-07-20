import * as R from 'ramda';
import { ResolverFn } from '../';
import { s3Client } from '../../clients/aws';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Sql as taskSql } from '../task/sql';

const fileIsDeleted = file => file.deleted !== '0000-00-00 00:00:00';

export const getDownloadLink: ResolverFn = async ({ s3Key }) =>
  s3Client.getSignedUrl('getObject', {
    Key: s3Key,
    Expires: 300 // 5 minutes
  });

export const getFilesByTaskId: ResolverFn = async (
  { id: tid },
  _args,
  { sqlClientPool }
) => {
  const rows = await query(sqlClientPool, Sql.selectTaskFiles(tid));

  return R.pipe(
    R.sort(R.descend(R.prop('created'))),
    R.reject(fileIsDeleted)
  )(rows);
};

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
      ACL: 'private'
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

  userActivityLogger.user_action(
    `User uploaded files for task '${task}' on project '${R.path(
      ['0', 'pid'],
      rowsPerms
    )}'`,
    {
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

  userActivityLogger.user_action(`User deleted files for task '${id}'`, {
    data: {
      id
    }
  });

  return 'success';
};
