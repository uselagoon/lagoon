// @flow

const Promise = require("bluebird");
const OpenShiftClient = require('openshift-client');
const sleep = require("es7-sleep");
const AWS = require('aws-sdk');
const crypto = require('crypto');
const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { getOpenShiftInfoForSiteGroup } = require('@amazeeio/lagoon-commons/src/api');

const { sendToAmazeeioLogs, initSendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { consumeTaskMonitor, initSendToAmazeeioTasks } = require('@amazeeio/lagoon-commons/src/tasks');

class BuildNotCompletedYet extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BuildNotCompletedYet';
  }
}

const accessKeyId =  process.env.AWS_KEY_ID
const secretAccessKey =  process.env.AWS_SECRET_ACCESS_KEY
const bucket = process.env.AWS_BUCKET
const region = process.env.AWS_REGION || 'us-east-2'


if ( !accessKeyId || !secretAccessKey || !bucket) {
  logger.error('AWS_KEY_ID or AWS_SECRET_ACCESS_KEY or AWS_BUCKET not set.')
}

AWS.config.update({accessKeyId: accessKeyId, secretAccessKey: secretAccessKey, region: region});
const s3 = new AWS.S3();

initSendToAmazeeioLogs();
initSendToAmazeeioTasks();

const messageConsumer = async msg => {
  const {
    buildName,
    siteGroupName,
    openshiftProject,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received BuildDeployOpenshift monitoring task for sitegroup: ${siteGroupName}, buildName: ${buildName}, openshiftProject: ${openshiftProject}, branch: ${branchName}, sha: ${sha}`);

  const siteGroupOpenShift = await getOpenShiftInfoForSiteGroup(siteGroupName);

  try {
    var gitSha = sha
    var openshiftConsole = siteGroupOpenShift.siteGroup.openshift.console.replace(/\/$/, "");
    var openshiftToken = siteGroupOpenShift.siteGroup.openshift.token || ""
  } catch(error) {
    logger.warn(`Error while loading information for sitegroup ${siteGroupName}: ${error}`)
    throw(error)
  }

  // OpenShift API object
  const openshift = new OpenShiftClient.OApi({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    },
  });

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  const kubernetes = new OpenShiftClient.Core({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    },
  });


  // kubernetes-client does not know about the OpenShift Resources, let's teach it.
  openshift.ns.addResource('builds');



  let projectStatus = {}
  try {
    const projectsGet = Promise.promisify(openshift.projects(openshiftProject).get, { context: openshift.projects(openshiftProject) })
    projectStatus = await projectsGet()
  } catch (err) {
    // a non existing project also throws an error, we check if it's a 404, means it does not exist, so we create it.
    if (err.code == 404) {
      logger.error(`Project ${openshiftProject} does not exist, bailing`)
      return
    } else {
      logger.error(err)
      throw new Error
    }
  }

  try {
    const buildsGet = Promise.promisify(openshift.ns(openshiftProject).builds(buildName).get, { context: openshift.ns(openshiftProject).builds(buildName) })
    buildstatus = await buildsGet()
  } catch (err) {
    if (err.code == 404) {
      logger.error(`Build ${buildName} does not exist, bailing`)
      return
    } else {
      logger.error(err)
      throw new Error
    }
  }

  let logMessage = ''
  if (sha) {
    logMessage = `\`${branchName}\` (${sha.substring(0, 7)})`
  } else {
    logMessage = `\`${branchName}\``
  }

  const buildPhase = buildstatus.status.phase.toLowerCase();
  const buildsLogGet = Promise.promisify(openshift.ns(openshiftProject).builds(`${buildName}/log`).get, { context: openshift.ns(openshiftProject).builds(`${buildName}/log`) })
  let s3UploadResult = {}
  let buildLog = ""
  const meta = JSON.parse(msg.content.toString())
  switch (buildPhase) {
    case "new":
    case "pending":
      sendToAmazeeioLogs('info', siteGroupName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${siteGroupName}]* ${logMessage} Build \`${buildName}\` not yet started`
      )
      throw new BuildNotCompletedYet(`*[${siteGroupName}]* ${logMessage} Build \`${buildName}\` not yet started`)
      break;

    case "running":
      sendToAmazeeioLogs('info', siteGroupName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${siteGroupName}]* ${logMessage} Build \`${buildName}\` running`
      )
      throw new BuildNotCompletedYet(`*[${siteGroupName}]* ${logMessage} Build \`${buildName}\` running`)
      break;

    case "cancelled":
    case "error":
      sendToAmazeeioLogs('warn', siteGroupName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${siteGroupName}]* ${logMessage} Build \`${buildName}\` cancelled`
      )
      break;

    case "failed":
      buildLog = await buildsLogGet()
      s3UploadResult = await uploadLogToS3(buildName, siteGroupName, branchName, buildLog)
      sendToAmazeeioLogs('error', siteGroupName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${siteGroupName}]* ${logMessage} Build \`${buildName}\` failed. Logs: ${s3UploadResult.Location}`
      )
      break;

    case "complete":
      buildLog = await buildsLogGet()
      s3UploadResult = await uploadLogToS3(buildName, siteGroupName, branchName, buildLog)

      sendToAmazeeioLogs('info', siteGroupName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${siteGroupName}]* ${logMessage} Build \`${buildName}\` complete. Logs: ${s3UploadResult.Location}}`
      )
      break;

    default:
      sendToAmazeeioLogs('info', siteGroupName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${siteGroupName}]* ${logMessage} Build \`${buildName}\` phase ${buildPhase}`
      )
      throw new BuildNotCompletedYet(`*[${siteGroupName}]* ${logMessage} Build \`${buildName}\` phase ${buildPhase}`)
      break;
  }

}

const uploadLogToS3 = async (buildName, siteGroupName, branchName, buildLog) => {

  const hash = crypto.createHash('sha256', `${buildName}:${siteGroupName}:${branchName}`).digest('hex');

  const path = `${siteGroupName}/${branchName}/${hash}.txt`

  const params = {
    Bucket: bucket,
    Key:    path,
    Body:   buildLog,
    ACL:    'public-read',
    ContentType: 'text/plain',
  };
  const s3Upload = Promise.promisify(s3.upload, { context: s3 })
  return s3Upload(params);

};


const deathHandler = async (msg, lastError) => {
  const {
    buildName,
    siteGroupName,
    openshiftProject,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  let logMessage = ''
  if (sha) {
    logMessage = `\`${branchName}\` (${sha.substring(0, 7)})`
  } else {
    logMessage = `\`${branchName}\``
  }

  sendToAmazeeioLogs('error', siteGroupName, "", "task:builddeploy-openshift:error",  {},
`*[${siteGroupName}]* ${logMessage} Build \`${buildName}\` ERROR:
\`\`\`
${lastError}
\`\`\``
  )

}

consumeTaskMonitor('builddeploy-openshift', messageConsumer, deathHandler)
