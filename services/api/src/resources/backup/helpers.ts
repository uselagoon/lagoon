import * as R from 'ramda';
import S3 from 'aws-sdk/clients/s3';
const { getConfigFromEnv } = require('../../util/config');

const makeS3TempLink = async restore => {
  const restoreLocation = R.prop('restoreLocation', restore);

  // https://{endpoint}/{bucket}/{key}
  const s3LinkMatch = /([^/]+)\/([^/]+)\/([^/]+)/;

  if (R.test(s3LinkMatch, restoreLocation)) {
    const s3Parts = R.match(s3LinkMatch, restoreLocation);

    const accessKeyId = getConfigFromEnv(
      'S3_BAAS_ACCESS_KEY_ID',
      'XXXXXXXXXXXXXXXXXXXX'
    );
    const secretAccessKey = getConfigFromEnv(
      'S3_BAAS_SECRET_ACCESS_KEY',
      'XXXXXXXXXXXXXXXXXXXX'
    );

    let awsS3Parts;
    const awsLinkMatch = /s3\.([^.]+)\.amazonaws\.com\//;

    if (R.test(awsLinkMatch, restoreLocation)) {
      awsS3Parts = R.match(awsLinkMatch, restoreLocation);
    }

    // We have to generate a new client every time because the endpoint is parsed
    // from the s3 url.
    const s3Client = new S3({
      accessKeyId,
      secretAccessKey,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      endpoint: `https://${R.prop(1, s3Parts)}`,
      region: awsS3Parts ? R.prop(1, awsS3Parts) : ''
    });

    const tempUrl = s3Client.getSignedUrl('getObject', {
      Bucket: R.prop(2, s3Parts),
      Key: R.prop(3, s3Parts),
      Expires: 300 // 5 minutes
    });

    return {
      ...restore,
      restoreLocation: tempUrl
    };
  }

  return restore;
};

export const Helpers = {
  makeS3TempLink
};
