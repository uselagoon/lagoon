const { S3Client } = require('@aws-sdk/client-s3');
import { getConfigFromEnv } from '../util/config';

export const config = {
  origin: getConfigFromEnv('S3_FILES_HOST', 'http://docker.for.mac.localhost:9000'),
  accessKeyId: getConfigFromEnv('S3_FILES_ACCESS_KEY_ID', 'minio'),
  secretAccessKey: getConfigFromEnv('S3_FILES_SECRET_ACCESS_KEY', 'minio123'),
  region: getConfigFromEnv('S3_FILES_REGION', 'eu-central-1'), // TODO: Determine default region
  bucket: getConfigFromEnv('S3_FILES_BUCKET', 'lagoon-files')
};

export const s3Client = new S3Client({
  endpoint: config.origin,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  region: config.region,
  forcePathStyle: true,
  signatureVersion: 'v4'
});