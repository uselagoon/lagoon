export * from '@lagoon/commons/dist/util/config';

const s3Config = {
  signedLinkExpiration: process.env.S3_SIGNED_LINK_EXPIRATION
    ? parseInt(process.env.S3_SIGNED_LINK_EXPIRATION, 10)
    : 300, // Default to 5 minutes
};

export { s3Config };

const envVarsConfig = {
  // Maximum number of variables/names accepted by the batch env-var
  // mutations (addOrUpdateEnvVariablesByName / deleteEnvVariablesByName).
  // Override at runtime with the BATCH_ENV_VARS_LIMIT environment variable.
  batchLimit: (() => {
    const parsed = parseInt(process.env.BATCH_ENV_VARS_LIMIT ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
  })(),
};

export { envVarsConfig };

export { getLagoonRouteFromEnv } from '@lagoon/commons/dist/util/lagoon'
