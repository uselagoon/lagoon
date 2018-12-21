// @flow

const R = require('ramda');
const AWS = require('aws-sdk');

const s3Host = R.propOr('http://docker.for.mac.localhost:9000', 'S3_HOST', process.env);
const accessKeyId =  R.propOr('minio', 'S3_ACCESS_KEY_ID', process.env);
const secretAccessKey =  R.propOr('minio123', 'S3_SECRET_ACCESS_KEY', process.env);
const bucket = R.propOr('api-files', 'S3_BUCKET', process.env);

const s3 = new AWS.S3({
  endpoint: s3Host,
  accessKeyId,
  secretAccessKey,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

module.exports = {
  s3Client: s3,
  s3Bucket: bucket,
};
