// @flow

const R = require('ramda');
const sqlClient = require('../../clients/sqlClient');
const { s3Client, s3Bucket } = require('../../clients/aws');
const { query } = require('../../util/db');
const Sql = require('./sql');
const taskSql = require('../task/sql');

/* ::

import type {ResolversObj} from '../';

*/

const generateDownloadLink = file => {
  const url = s3Client.getSignedUrl('getObject', {
    Bucket: s3Bucket,
    Key: file.s3Key,
    Expires: 900, // 15 minutes
  });

  return {
    ...file,
    download: url,
  };
};

const fileIsDeleted = file => file.deleted !== '0000-00-00 00:00:00';

const getFilesByTaskId = async (
  { id: tid },
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  if (role !== 'admin') {
    const rowsPerms = await query(sqlClient, taskSql.selectPermsForTask(tid));

    if (
      !R.contains(R.path(['0', 'pid'], rowsPerms), projects) &&
      !R.contains(R.path(['0', 'cid'], rowsPerms), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  const rows = await query(sqlClient, Sql.selectTaskFiles(tid));

  return R.pipe(
    R.sort(R.descend(R.prop('created'))),
    R.reject(fileIsDeleted),
    R.map(generateDownloadLink),
  )(rows);
};

const uploadFilesForTask = async (
  root,
  { input: { task, files } },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  if (role !== 'admin') {
    const rowsPerms = await query(sqlClient, taskSql.selectPermsForTask(task));

    if (
      !R.contains(R.path(['0', 'pid'], rowsPerms), projects) &&
      !R.contains(R.path(['0', 'cid'], rowsPerms), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  const resolvedFiles = await Promise.all(files);
  const uploadAndTrackFiles = resolvedFiles.map(async newFile => {
    const s3_key = `tasks/${task}/${newFile.filename}`;
    const params = {
      Bucket: s3Bucket,
      Key: s3_key,
      Body: newFile.stream,
      ACL: 'private',
    };
    await s3Client.upload(params).promise();

    const {
      info: { insertId },
    } = await query(
      sqlClient,
      Sql.insertFile({
        filename: newFile.filename,
        s3_key,
        created: '2010-01-01 00:00:00',
      }),
    );

    await query(
      sqlClient,
      Sql.insertFileTask({
        tid: task,
        fid: insertId,
      }),
    );
  });

  await Promise.all(uploadAndTrackFiles);

  const rows = await query(sqlClient, taskSql.selectTask(task));

  return R.prop(0, rows);
};

const deleteFilesForTask = async (
  root,
  { input: { id } },
  { credentials: { role } },
) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const rows = await query(sqlClient, Sql.selectTaskFiles(id));
  const deleteObjects = R.map(file => ({ Key: file.s3Key }), rows);

  const params = {
    Bucket: s3Bucket,
    Delete: {
      Objects: deleteObjects,
      Quiet: false,
    },
  };
  await s3Client.deleteObjects(params).promise();

  await query(sqlClient, Sql.deleteFileTask(id));

  return 'success';
};

const Resolvers /* : ResolversObj */ = {
  getFilesByTaskId,
  uploadFilesForTask,
  deleteFilesForTask,
};

module.exports = Resolvers;
