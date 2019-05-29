// @flow

const R = require('ramda');
const S3 = require('aws-sdk/clients/s3');

const makeS3TempLink = async (restore /* : Object */) => {
  const restoreLocation = R.prop('restoreLocation', restore);

  const accessKeyId = R.propOr(
    'XXXXXXXXXXXXXXXXXXXX',
    'S3_BAAS_ACCESS_KEY_ID',
    process.env,
  );
  const secretAccessKey = R.propOr(
    'XXXXXXXXXXXXXXXXXXXX',
    'S3_BAAS_SECRET_ACCESS_KEY',
    process.env,
  );

  // https://{endpoint}/{bucket}/{key}
  const s3LinkMatch = /([^/]+)\/([^/]+)\/([^/]+)/;

  const s3Parts = R.match(s3LinkMatch, restoreLocation);

  // We have to generate a new client every time because the endpoint is parsed
  // from the s3 url.
  const s3Client = new S3({
    accessKeyId,
    secretAccessKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    endpoint: `https://${R.prop(1, s3Parts)}`,
  });

  const tempUrl = s3Client.getSignedUrl('getObject', {
    Bucket: R.prop(2, s3Parts),
    Key: R.prop(3, s3Parts),
    Expires: 300, // 5 minutes
  });

  return {
    ...restore,
    restoreLocation: tempUrl,
  };
};

const Helpers = {
  makeS3TempLink,
};

module.exports = Helpers;
