import { ResolverFn } from '..';
import { getEnvironmentName, convertBytesToHumanFileSize } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// s3 config
const accessKeyId =  process.env.S3_FILES_ACCESS_KEY_ID || 'minio'
const secretAccessKey =  process.env.S3_FILES_SECRET_ACCESS_KEY || 'minio123'
const bucket = process.env.S3_FILES_BUCKET || 'lagoon-files'
const region = process.env.S3_FILES_REGION || 'eu-central-1' // TODO: Determine default region
const s3Origin = process.env.S3_FILES_HOST || 'http://docker.for.mac.localhost:9000'

const config = {
  origin: s3Origin,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region,
  bucket: bucket
};

const s3Client = new S3Client({
  endpoint: config.origin,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  region: config.region,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

// Get insights files directly from the bucket
export const getInsightsBucketFiles = async ({ prefix }) => {
	try {
    const data = await s3Client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));

    if (!data.Contents) {
      return [];
    }

    return await JSON.parse(JSON.stringify(data.Contents));
	}
  catch (e) {
    throw new Error(`Error retrieving bucket items - ${e.message}`)
	}
}

export const getInsightsDownloadUrl: ResolverFn = async (
  { fileId, environment, file },
  _args,
  { sqlClientPool }
) => {

  const environmentData = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(parseInt(environment));
  const projectData = await projectHelpers(sqlClientPool).getProjectById(
    environmentData.project
  );

  let environmentName = getEnvironmentName(environmentData, projectData);

	try {
    const s3Key = `insights/${projectData.name}/${environmentName}/${file}`;

    const command = new GetObjectCommand({ Bucket: bucket, Key: s3Key });

    return await getSignedUrl(s3Client, command, { expiresIn: 600 });
	} catch (e) {
    return `Error while creating download link - ${e.message}`;
	}
}

export const getInsightsFileData: ResolverFn = async (
  { fileId, environment, file },
  _args,
  { sqlClientPool }
) => {
  if (!fileId) {
    return null;
  }

  const environmentData = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(parseInt(environment));
  const projectData = await projectHelpers(sqlClientPool).getProjectById(
    environmentData.project
  );

  let environmentName = getEnvironmentName(environmentData, projectData);

  try {
    let insightsFile = 'insights/'+projectData.name+'/'+environmentName+'/'+file
    const data = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: insightsFile }));


    if (!data) {
      return null;
    }

    const dataBytes = await data.Body.transformToByteArray();

    return JSON.parse(JSON.stringify(dataBytes));
  } catch (e) {
    return `There was an error loading insights data: ${e.message}\nIf this error persists, contact your Lagoon support team.`;
  }
};

export const getInsightsFilesByEnvironmentId: ResolverFn = async (
  { id: eid },
  { name, limit },
  { sqlClientPool, hasPermission, adminScopes }
) => {

  if (!eid) {
    throw "No Environment ID given.";
  }

  const environmentData = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(parseInt(eid));

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
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
