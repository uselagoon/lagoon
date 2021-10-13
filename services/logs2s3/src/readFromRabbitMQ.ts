import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { logger } from '@lagoon/commons/dist/local-logging';
import S3 from 'aws-sdk/clients/s3';

const accessKeyId =  process.env.S3_FILES_ACCESS_KEY_ID || 'minio'
const secretAccessKey =  process.env.S3_FILES_SECRET_ACCESS_KEY || 'minio123'
const bucket = process.env.S3_FILES_BUCKET || 'lagoon-files'
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

export async function readFromRabbitMQ(
  msg: ConsumeMessage,
  channelWrapperLogs: ChannelWrapper
): Promise<void> {
  const logMessage = JSON.parse(msg.content.toString());

  const { severity, project, uuid, event, meta, message } = logMessage;


  switch (event) {
    // handle builddeploy build logs from lagoon builds
    case String(event.match(/^build-logs:builddeploy-kubernetes:.*/)):
      logger.verbose(`received ${event} for project ${project} environment ${meta.branchName} - name:${meta.jobName}, remoteId:${meta.remoteId}`);
      await s3Client.putObject({
        Bucket: bucket,
        Key: 'buildlogs/'+project+'/'+meta.branchName+'/'+meta.jobName+'-'+meta.remoteId+'.txt',
        ContentType: 'text/plain',
        Body: Buffer.from(message, 'binary')
      }).promise();

      channelWrapperLogs.ack(msg);
      break;
    // handle tasks events for tasks logs
    // yes this says build-logs but it should be task-logs, will be fixed in controller and phased out at some stage
    // the build-logs is a flow on from days past
    case String(event.match(/^build-logs:job-kubernetes:.*/)):
    case String(event.match(/^task-logs:job-kubernetes:.*/)):
      if (meta.environment) {
        // if the environment is in the data, then save the log to the environments directory
        // some versions of the controller don't send this value in the log meta
        // the resolver in the api also knows to check in both locations when trying to load logs
        logger.verbose(`received ${event} for project ${project} environment ${meta.environment} - id:${meta.task.id}, remoteId:${meta.remoteId}`);
        await s3Client.putObject({
          Bucket: bucket,
          Key: 'tasklogs/'+project+'/'+meta.environment+'/'+meta.task.id+'-'+meta.remoteId+'.txt',
          ContentType: 'text/plain',
          Body: Buffer.from(message, 'binary')
        }).promise();
      } else {
        logger.verbose(`received ${event} for project ${project} - id:${meta.task.id}, remoteId:${meta.remoteId}`);
        await s3Client.putObject({
          Bucket: bucket,
          Key: 'tasklogs/'+project+'/'+meta.task.id+'-'+meta.remoteId+'.txt',
          ContentType: 'text/plain',
          Body: Buffer.from(message, 'binary')
        }).promise();
      }
      channelWrapperLogs.ack(msg);
      break;
    default:
      return channelWrapperLogs.ack(msg);
  }
}
