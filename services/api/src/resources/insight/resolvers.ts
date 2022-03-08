import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { ResolverFn } from '..';
import {
  pubSub,
  createEnvironmentFilteredSubscriber
} from '../../clients/pubSub';
import { getConfigFromEnv, getLagoonRouteFromEnv } from '../../util/config';

import { knex, query, isPatchEmpty } from '../../util/db';
import { Sql } from '../file/sql';
import { Helpers } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';

import S3 from 'aws-sdk/clients/s3';
import sha1 from 'sha1';


const accessKeyId =  process.env.S3_FILES_ACCESS_KEY_ID || 'minio'
const secretAccessKey =  process.env.S3_FILES_SECRET_ACCESS_KEY || 'minio123'
const bucket = process.env.S3_INSIGHTS_BUCKET || 'lagoon-insights'
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

const convertDateFormat = R.init;

const getEnvironmentName = (
  environmentData,
  projectData
) => {
  // we need to get the safename of the environment from when it was created
  const makeSafe = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')
  var environmentName = makeSafe(environmentData.name)
  var overlength = 58 - projectData.name.length;
  if ( environmentName.length > overlength ) {
    var hash = sha1(environmentName).substring(0,4)
    environmentName = environmentName.substring(0, overlength-5)
    environmentName = environmentName.concat('-' + hash)
  }

  return environmentName ? environmentName : ""
}

//let insightsFile = projectData.name+'/'+environmentName+'/'+file

export const getInsightsDownloadUrl: ResolverFn = async ({ s3Key }) => {
	try {
    return s3Client.getSignedUrl('getObject', {Bucket: bucket, Key: s3Key, Expires: 600});
	} catch (e) {
   return `Error while creating download link - ${e.Error}`
	}
}

export const getInsightsFile: ResolverFn = async (
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

  let environmentName = getEnvironmentName(environmentData, projectData)
  return projectData.name+'/'+environmentName+'/'+file
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

  let environmentName = getEnvironmentName(environmentData, projectData)

  try {
    // let insightsFile = 'insights/'+projectData.name+'/'+environmentName+'/'+file
    let insightsFile = projectData.name+'/'+environmentName+'/'+file
    const data = await s3Client.getObject({Bucket: bucket, Key: insightsFile}).promise();

    if (!data) {
      return null;
    }

    if (data.ContentEncoding == 'gzip') {
      return "Compressed file"
    }
    return new Buffer(JSON.parse(JSON.stringify(data.Body)).data).toString('ascii');;
  } catch (e) {
    return `There was an error loading insights data: ${e.message}\nIf this error persists, contact your Lagoon support team.`;
  }
};

export const getFilesByInsightId: ResolverFn = async (
  { id: iid },
  _args,
  { sqlClientPool }
) => query(sqlClientPool, Sql.selectInsightFiles(iid));

export const deleteFilesForInsight: ResolverFn = async (
  root,
  { input: { id, eid } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {

  await hasPermission('environent', 'delete', {
    project: eid
  });

  const rows = await query(sqlClientPool, Sql.selectInsightFiles(id));
  const deleteObjects = R.map((file: any) => ({ Key: file.s3Key }), rows);

  const params = {
    Delete: {
      Objects: deleteObjects,
      Quiet: false
    }
  };
  // @ts-ignore
  await s3Client.deleteObjects(params).promise();
  await query(sqlClientPool, Sql.deleteFileInsight(id));

  userActivityLogger(`User deleted files for insight '${id}'`, {
    project: '',
    event: 'api:deleteFilesForInsight',
    data: {
      id
    }
  });

  return 'success';
};

export const getInsightsFilesByEnvironmentId: ResolverFn = async (
  { id: eid, environmentAuthz },
  { name, limit },
  { sqlClientPool, hasPermission }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(eid);

  if (!environmentAuthz) {
    await hasPermission('environment', 'view', {
      project: environment.project
    });
  }

  let queryBuilder = knex('insight')
    .where('environment', eid)
    .orderBy('created', 'desc')
    .orderBy('id', 'desc');

  if (name) {
    queryBuilder = queryBuilder.andWhere('name', name);
  }

  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  return query(sqlClientPool, queryBuilder.toString());
};
