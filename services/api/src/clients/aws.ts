import S3 from 'aws-sdk/clients/s3';
import { getConfigFromEnv } from '../util/config';

export const config = {
  origin: getConfigFromEnv('S3_HOST', 'http://docker.for.mac.localhost:9000'),
  accessKeyId: getConfigFromEnv('S3_FILES_ACCESS_KEY_ID', 'minio'),
  secretAccessKey: getConfigFromEnv('S3_FILES_SECRET_ACCESS_KEY', 'minio123'),
  region: getConfigFromEnv('S3_FILES_REGION'),
  bucket: getConfigFromEnv('S3_FILES_BUCKET', 'lagoon-files')
};

export const s3Client = new S3({
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
