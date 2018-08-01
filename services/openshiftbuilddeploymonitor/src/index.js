// @flow

const Promise = require("bluebird");
const OpenShiftClient = require('openshift-client');
const sleep = require("es7-sleep");
const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const { logger } = require('@lagoon/commons/src/local-logging');
const { getOpenShiftInfoForProject } = require('@lagoon/commons/src/api');
const { updateEnvironment } = require('@lagoon/commons/src/api');
const { getEnvironmentByName } = require('@lagoon/commons/src/api');

const { sendToLagoonLogs, initSendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { consumeTaskMonitor, initSendToLagoonTasks } = require('@lagoon/commons/src/tasks');

class BuildNotCompletedYet extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BuildNotCompletedYet';
  }
}

const accessKeyId =  process.env.AWS_ACCESS_KEY_ID
const secretAccessKey =  process.env.AWS_SECRET_ACCESS_KEY
const bucket = process.env.AWS_BUCKET
const region = process.env.AWS_REGION || 'us-east-2'


if ( !accessKeyId || !secretAccessKey || !bucket) {
  logger.error('AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY or AWS_BUCKET not set.')
}

AWS.config.update({accessKeyId: accessKeyId, secretAccessKey: secretAccessKey, region: region});
const s3 = new AWS.S3();

initSendToLagoonLogs();
initSendToLagoonTasks();

const messageConsumer = async msg => {
  const {
    buildName,
    projectName,
    openshiftProject,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received BuildDeployOpenshift monitoring task for project: ${projectName}, buildName: ${buildName}, openshiftProject: ${openshiftProject}, branch: ${branchName}, sha: ${sha}`);
  let result
  result = await getOpenShiftInfoForProject(projectName);
  const projectOpenshift = result.project

  result = await getEnvironmentByName(`${branchName}`, projectOpenshift.id)
  const environmentOpenshift = result.environmentByName

  try {
    var gitSha = sha
    var openshiftConsole = projectOpenshift.openshift.console_url.replace(/\/$/, "");
    var openshiftToken = projectOpenshift.openshift.token || ""
  } catch(error) {
    logger.warn(`Error while loading information for project ${projectName}: ${error}`)
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
  const routesGet = Promise.promisify(openshift.ns(openshiftProject).routes.get, { context: openshift.ns(openshiftProject).routes })

  const getAllRoutesURLs = async () => {
    const allRoutesObject = await routesGet();
    let hosts = []
    hosts = allRoutesObject.items.map(route => {
      const schema = ("tls" in route) ? 'https://' : 'http://'
      return `${schema}${route.spec.host}`
    })
    return hosts
  }

  let logLink = ""
  const meta = JSON.parse(msg.content.toString())
  switch (buildPhase) {
    case "new":
    case "pending":
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${buildName}\` not yet started`
      )
      throw new BuildNotCompletedYet(`*[${projectName}]* ${logMessage} Build \`${buildName}\` not yet started`)
      break;

    case "running":
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${buildName}\` running`
      )
      throw new BuildNotCompletedYet(`*[${projectName}]* ${logMessage} Build \`${buildName}\` running`)
      break;

    case "cancelled":
    case "error":
      try {
        const buildLog = await buildsLogGet()
        const s3UploadResult = await uploadLogToS3(buildName, projectName, branchName, buildLog)
        logLink = `<${s3UploadResult.Location}|Logs>`
      } catch (err) {
        logger.warn(`${openshiftProject} ${buildName}: Error while getting and uploading Logs to S3, Error: ${err}. Continuing without log link in message`)
      }
      sendToLagoonLogs('warn', projectName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${buildName}\` cancelled. ${logLink}`
      )
      break;

    case "failed":
      try {
        const buildLog = await buildsLogGet()
        const s3UploadResult = await uploadLogToS3(buildName, projectName, branchName, buildLog)
        logLink = `<${s3UploadResult.Location}|Logs>`
      } catch (err) {
        logger.warn(`${openshiftProject} ${buildName}: Error while getting and uploading Logs to S3, Error: ${err}. Continuing without log link in message`)
      }

      sendToLagoonLogs('error', projectName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${buildName}\` failed. ${logLink}`
      )
      break;

    case "complete":
      try {
        const buildLog = await buildsLogGet()
        const s3UploadResult = await uploadLogToS3(buildName, projectName, branchName, buildLog)
        logLink = `<${s3UploadResult.Location}|Logs>`
      } catch (err) {
        logger.warn(`${openshiftProject} ${buildName}: Error while getting and uploading Logs to S3, Error: ${err}. Continuing without log link in message`)
      }

      const routes = await getAllRoutesURLs()
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${buildName}\` complete. ${logLink} \n ${routes.join("\n")}`
      )
      try {
        const updateEnvironmentResult = await updateEnvironment(
          branchName,
          environmentOpenshift.id,
          `{
            lagoon_route: "${routes[0]}",
            lagoon_routes: "${routes.join(",")}",
            project: ${projectOpenshift.id}
          }`)
        } catch (err) {
          logger.warn(`${openshiftProject} ${buildName}: Error while updating routes in API, Error: ${err}. Continuing without update`)
        }
      break;

    default:
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${buildName}\` phase ${buildPhase}`
      )
      throw new BuildNotCompletedYet(`*[${projectName}]* ${logMessage} Build \`${buildName}\` phase ${buildPhase}`)
      break;
  }

}

const uploadLogToS3 = async (buildName, projectName, branchName, buildLog) => {
  const uuid = uuidv4();
  const path = `${projectName}/${branchName}/${uuid}.txt`

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
    projectName,
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

  sendToLagoonLogs('error', projectName, "", "task:builddeploy-openshift:error",  {},
`*[${projectName}]* ${logMessage} Build \`${buildName}\` ERROR:
\`\`\`
${lastError}
\`\`\``
  )

}

consumeTaskMonitor('builddeploy-openshift', messageConsumer, deathHandler)
