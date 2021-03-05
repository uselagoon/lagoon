const R = require('ramda');
const S3 = require('aws-sdk/clients/s3');

const s3Host = R.propOr('http://docker.for.mac.localhost:9000', 'S3_FILES_HOST', process.env);
const accessKeyId = R.propOr('minio', 'S3_FILES_ACCESS_KEY_ID', process.env);
const secretAccessKey = R.propOr('minio123', 'S3_FILES_SECRET_ACCESS_KEY', process.env);
const bucket = R.propOr('lagoon-files', 'S3_FILES_BUCKET', process.env);
const s3Region = R.propOr('', 'S3_FILES_REGION', process.env);

const s3 = new S3({
  endpoint: s3Host,
  accessKeyId,
  secretAccessKey,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
  region: s3Region,
  params: {
    Bucket: bucket,
  },
});

module.exports = {
  s3Client: s3,
};
