import * as R from 'ramda';
import { ResolverFn } from '../';
import { s3Client } from '../../clients/aws';
import { query } from '../../util/db';
import { Sql as taskSql } from '../task/sql';
import { s3Config } from '../../util/config';
import { AuditLog } from '../audit/types';
import { AuditType } from '@lagoon/commons/dist/types';
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, DeleteObjectsCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// if this is google cloud storage or not
const isGCS = process.env.S3_FILES_GCS || 'false'
const bucket = process.env.S3_FILES_BUCKET || 'lagoon-files'

async function generateDownloadLink(s3Key: string, userActivityLogger?: Function ) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: s3Key });

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
  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: s3Config.signedLinkExpiration,
  });
  return signedUrl;
}

export const getDownloadLink: ResolverFn = async ({ s3Key }, input, { userActivityLogger }) => {
  return generateDownloadLink(s3Key, userActivityLogger);
};

export const getDownloadLinkByTaskFileId: ResolverFn = async (
  root,
  { taskId, fileId },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rowsPerms = await query(sqlClientPool, taskSql.selectPermsForTask(taskId));

  await hasPermission('task', 'view', {
    project: R.path(['0', 'pid'], rowsPerms)
  });

  const command = new ListObjectsCommand({ Bucket: bucket, Prefix: `tasks/${taskId}` });
  const response = await s3Client.send(command);
  if (response.Contents) {
    let count = 0;
    for (const obj of response.Contents) {
      count++;
      if (count == fileId) {
        const downloadUrl = await generateDownloadLink(obj.Key, userActivityLogger)
        return downloadUrl;
      }
    }
  }
  throw new Error(`File not found`);
}

export const getFilesByTaskId: ResolverFn = async (
  { id: tid },
  _args,
  { sqlClientPool }
) => {
  const command = new ListObjectsCommand({ Bucket: bucket, Prefix: `tasks/${tid}` });
  const response = await s3Client.send(command);
  if (response.Contents) {
    let objects = [];
    let count = 0;
    for (const obj of response.Contents) {
      count++;
      const date = new Date(obj.LastModified);
      let path = require('path');
      objects.push({
        id: count,
        filename: path.basename(obj.Key),
        s3Key: obj.Key,
        // fix the date for lagoon styled dates
        created: date.toISOString().slice(0, 19).replace('T', ' ')
      })
    }
    return objects;
  }
  return [];
}

export const getTaskFileUploadForm: ResolverFn = async (
  root,
  { input: { task, filename } },
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

  const s3_key = `tasks/${task}/${filename}`;
  const signedurl = await generatePresignedPostUrl(s3_key)
  const auditLog: AuditLog = {
    resource: {
      type: AuditType.FILE,
      details: s3_key
    },
  };
  userActivityLogger(`User requested file upload link`, {
    event: 'api:getTaskFileUploadForm',
    payload: {
      Key: s3_key,
      ...auditLog
    }
  });
  return {postUrl: signedurl.url, formFields: signedurl.fields};
}

async function generatePresignedPostUrl(key) {
  try {
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: bucket,
      Key: key,
      Expires: 60, // 60 seconds
      Conditions: [
        // limit upload size? maybe configurable at project/org level instead?
        ["content-length-range", 0, 1099511627776], // 1tb
      ],
    });

    return { url, fields };
  } catch (error) {
    throw new Error(`Error generating presigned POST URL`);
  }
}

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

  const command = new ListObjectsCommand({ Bucket: bucket, Prefix: `tasks/${id}` });
  const response = await s3Client.send(command);
  if (response.Contents) {
    let deleteObjects = [];
    let count = 0;
    for (const obj of response.Contents) {
      count++;
      deleteObjects.push({
        Key: obj.Key
      })
    }
    const deletecommand = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: deleteObjects,
        Quiet: false
      }
    });
    await s3Client.send(deletecommand);
  }

  userActivityLogger(`User deleted files for task '${id}'`, {
    project: '',
    event: 'api:deleteFilesForTask',
    payload: {
      id
    }
  });

  return 'success';
};
