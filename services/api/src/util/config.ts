export * from '@lagoon/commons/dist/util/config';

const s3Config = {
//   accessKeyId: process.env.S3_FILES_ACCESS_KEY_ID || 'minio',
//   secretAccessKey: process.env.S3_FILES_SECRET_ACCESS_KEY || 'minio123',
//   bucket: process.env.S3_FILES_BUCKET || 'lagoon-files',
//   region: process.env.S3_FILES_REGION,
//   origin: process.env.S3_FILES_HOST || 'http://docker.for.mac.localhost:9000',
  signedLinkExpiration: process.env.S3_SIGNED_LINK_EXPIRATION
    ? parseInt(process.env.S3_SIGNED_LINK_EXPIRATION, 10)
    : 300, // Default to 5 minutes
};

export { s3Config };

export { getLagoonRouteFromEnv } from '@lagoon/commons/dist/util/lagoon'
