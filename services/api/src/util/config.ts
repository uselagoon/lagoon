export * from '@lagoon/commons/dist/util/config';

const s3Config = {
  signedLinkExpiration: process.env.S3_SIGNED_LINK_EXPIRATION
    ? parseInt(process.env.S3_SIGNED_LINK_EXPIRATION, 10)
    : 300, // Default to 5 minutes
};

export { s3Config };

export { getLagoonRouteFromEnv } from '@lagoon/commons/dist/util/lagoon'
