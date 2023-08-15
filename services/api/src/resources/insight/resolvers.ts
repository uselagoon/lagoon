import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { ResolverFn } from '..';
import {
  pubSub,
  createEnvironmentFilteredSubscriber
} from '../../clients/pubSub';
import { getConfigFromEnv, getLagoonRouteFromEnv } from '../../util/config';

import { getEnvironmentName, convertBytesToHumanFileSize } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';

import S3 from 'aws-sdk/clients/s3';

// s3 config
const accessKeyId =  process.env.S3_FILES_ACCESS_KEY_ID || 'minio'
const secretAccessKey =  process.env.S3_FILES_SECRET_ACCESS_KEY || 'minio123'
const bucket = process.env.S3_FILES_BUCKET || 'lagoon-files'
const region = process.env.S3_FILES_REGION
const s3Origin = process.env.S3_FILES_HOST || 'http://docker.for.mac.localhost:9000'

const config = {
  origin: s3Origin,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region,
  bucket: bucket
};

const s3Client = new S3({
  endpoint: config.origin,
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.region,
  params: {
    Bucket: config.bucket
  },
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

// Get insights files directly from the bucket
export const getInsightsBucketFiles = async ({ prefix }) => {
	try {
    const data = await s3Client.listObjects({ Bucket: bucket, Prefix: prefix }, function(err, data) {
      if (err) {
        throw new Error(`Failed to get items: ${err}`);
      } else {
         return data;
      }
    }).promise();

    if (!data) {
      return null;
    }

    return await JSON.parse(JSON.stringify(data.Contents));
	}
  catch (e) {
    throw new Error(`Error retrieving bucket items - ${e.Error}`)
	}
}

export const getInsightsDownloadUrl: ResolverFn = async (
  { fileId, environment, file },
  _args,
  { sqlClientPool, userActivityLogger }
) => {

  const environmentData = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(parseInt(environment));
  const projectData = await projectHelpers(sqlClientPool).getProjectById(
    environmentData.project
  );

  let environmentName = getEnvironmentName(environmentData, projectData);

  userActivityLogger(`User queried getInsightsDownloadUrl`, {
    project: '',
    event: 'api:getInsightsDownloadUrl',
    payload: { args: _args },
  }, 'user_query');

	try {
    const s3Key = `insights/${projectData.name}/${environmentName}/${file}`;

    return s3Client.getSignedUrl('getObject', {Bucket: bucket, Key: s3Key, Expires: 600});
	} catch (e) {
   return `Error while creating download link - ${e.Error}`
	}
}

export const getInsightsFileData: ResolverFn = async (
  { fileId, environment, file },
  _args,
  { sqlClientPool, userActivityLogger }
) => {
  if (!fileId) {
    return null;
  }

  userActivityLogger(`User queried getInsightsFileData`, {
    project: '',
    event: 'api:getInsightsFileData',
    payload: { args: _args },
  }, 'user_query');

  const environmentData = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(parseInt(environment));
  const projectData = await projectHelpers(sqlClientPool).getProjectById(
    environmentData.project
  );

  let environmentName = getEnvironmentName(environmentData, projectData);

  try {
    let insightsFile = 'insights/'+projectData.name+'/'+environmentName+'/'+file
    const data = await s3Client.getObject({Bucket: bucket, Key: insightsFile}).promise();

    if (!data) {
      return null;
    }

    return JSON.parse(JSON.stringify(data.Body));
  } catch (e) {
    return `There was an error loading insights data: ${e.message}\nIf this error persists, contact your Lagoon support team.`;
  }
};

export const getInsightsFilesByEnvironmentId: ResolverFn = async (
  { id: eid },
  { name, limit },
  { sqlClientPool, hasPermission, adminScopes, userActivityLogger }
) => {

  if (!eid) {
    throw "No Environment ID given.";
  }

  userActivityLogger(`User queried getInsightsFilesByEnvironmentId`, {
    project: '',
    event: 'api:getInsightsFilesByEnvironmentId',
    payload: { id: eid, name, limit },
  }, 'user_query');

  const environmentData = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(parseInt(eid));

  if (!adminScopes.projectViewAll) {
    await hasPermission('environment', 'view', {
      project: environmentData.project
    });
  }

  const projectData = await projectHelpers(sqlClientPool).getProjectById(
    environmentData.project
  );
  const environmentName = getEnvironmentName(environmentData, projectData);

  const insightsItems = await getInsightsBucketFiles({ prefix: 'insights/'+projectData.name+'/'+environmentName+'/'});
  const files = await Promise.all(insightsItems.map(async (file, index) => {
    const fileName = file.Key ? file.Key.split("/").pop() : "";
    const type = fileName ? fileName.split('-')[0] : "";
    const service = fileName ? fileName.split('-').at('-1').split('.')[0] : "";

    return {
      id: index+1,
      file: fileName,
      size: file.Size && convertBytesToHumanFileSize(file.Size),
      created: file.LastModified && file.LastModified,
      service: service,
      type: type,
      environment: eid,
    }
  }));

  return files;
};
