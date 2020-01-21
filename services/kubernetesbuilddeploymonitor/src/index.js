// @flow

const promisify = require('util').promisify;
const kubernetesClient = require('kubernetes-client');
const sleep = require("es7-sleep");
const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const R = require('ramda');
const { logger } = require('@lagoon/commons/src/local-logging');

const {
  getOpenShiftInfoForProject,
  getEnvironmentByName,
  updateEnvironment,
  getDeploymentByRemoteId,
  updateDeployment,
  setEnvironmentServices,
} = require('@lagoon/commons/src/api');

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
    buildName: jobName,
    projectName,
    openshiftProject,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received BuildDeploykubernetes monitoring task for project: ${projectName}, jobName: ${jobName}, openshiftProject: ${openshiftProject}, branch: ${branchName}, sha: ${sha}`);
  
  const projectResult = await getOpenShiftInfoForProject(projectName);
  const project = projectResult.project

  const environmentResult = await getEnvironmentByName(branchName, project.id)
  const environment = environmentResult.environmentByName

  try {
    var gitSha = sha
    var kubernetesConsole = project.kubernetes.consoleUrl.replace(/\/$/, "");
    var kubernetesToken = project.kubernetes.token || ""
  } catch(error) {
    logger.warn(`Error while loading information for project ${projectName}: ${error}`)
    throw(error)
  }

  // kubernetes API object
  const kubernetesApi = new kubernetesClient.Api({
    url: kubernetesConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: kubernetesToken
    },
  });

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of kubernetes and
  // the kubernetes API does not support them.
  const kubernetesCore = new kubernetesClient.Core({
    url: kubernetesConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: kubernetesToken
    },
  });

  const kubernetesBatchApi = new OpenShiftClient.Batch({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });

  let project = {}
  try {
    const namespacesSearch = promisify(kubernetesCore.namespaces.get);
    const namespacesResult = await namespacesSearch({
      qs: {
        fieldSelector: `metadata.name=${openshiftProject}`
      }
    });
  
    const namespaces = R.propOr([], 'items', namespacesResult);
    if (!R.isEmpty(namespaces)) {
      project = namespaces[0];
    }
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

  let jobInfo;
  try {
    const jobsGet = promisify(
      kubernetesBatchApi.namespaces(openshiftProject).jobs(jobName).get
    );
    jobInfo = await jobsGet();
  } catch (err) {
    if (err.code == 404) {
      logger.error(`Job ${jobName} does not exist, bailing`);
      failTask(taskId);
      return;
    } else {
      logger.error(err);
      throw new Error();
    }
  }

  const buildPhase = project.status.phase.toLowerCase();


  const jobsLogGet = async () => {
    // First fetch the pod(s) used to run this job
    const podsGet = promisify(kubernetesCore.ns(openshiftProject).pods.get);
    const pods = await podsGet({
      qs: {
        labelSelector: `job-name=${jobName}`
      }
    });
    const podNames = pods.items.map(pod => pod.metadata.name);

    // Combine all logs from all pod(s)
    let finalLog = '';
    for (const podName of podNames) {
      const podLogGet = promisify(
        kubernetesCore.ns(openshiftProject).pods(podName).log.get
      );
      const podLog = await podLogGet();

      finalLog =
        finalLog +
        `
========================================
Logs on pod ${podName}
========================================
${podLog}`;
    }

    return finalLog;
  };

  // const buildsLogGet = Promise.promisify(kubernetes.ns(openshiftProject).builds(`${jobName}/log`).get, { context: kubernetes.ns(openshiftProject).builds(`${jobName}/log`) })
  // const routesGet = Promise.promisify(kubernetes.ns(openshiftProject).routes.get, { context: kubernetes.ns(openshiftProject).routes })

  try {
    const deployment = await getDeploymentByRemoteId(buildstatus.metadata.uid);
    if (!deployment.deploymentByRemoteId) {
      throw new Error(`No deployment found with remote id ${buildstatus.metadata.uid}`);
    }

    const convertDateFormat = R.init;
    const dateOrNull = R.unless(R.isNil, convertDateFormat);

    await updateDeployment(deployment.deploymentByRemoteId.id, {
      status: buildstatus.status.phase.toUpperCase(),
      created: convertDateFormat(buildstatus.metadata.creationTimestamp),
      started: dateOrNull(buildstatus.status.startTimestamp),
      completed: dateOrNull(buildstatus.status.completionTimestamp),
    });
  } catch (error) {
    logger.error(`Could not update deployment ${projectName} ${jobName}. Message: ${error}`);
  }

  const meta = JSON.parse(msg.content.toString())
  let logLink = ""
  let logMessage = ''
  if (sha) {
    meta.shortSha = sha.substring(0, 7)
    logMessage = `\`${branchName}\` (${sha.substring(0, 7)})`
  } else {
    logMessage = `\`${branchName}\``
  }
  switch (buildPhase) {
    case "new":
    case "pending":
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-kubernetes:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` not yet started`
      )
      throw new BuildNotCompletedYet(`*[${projectName}]* ${logMessage} Build \`${jobName}\` not yet started`)
      break;

    case "running":
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-kubernetes:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` running`
      )
      throw new BuildNotCompletedYet(`*[${projectName}]* ${logMessage} Build \`${jobName}\` running`)
      break;

    case "cancelled":
    case "error":
      try {
        const buildLog = await jobsLogGet()
        const s3UploadResult = await saveBuildLog(jobName, projectName, branchName, buildLog, buildstatus)
        logLink = s3UploadResult.Location
        meta.logLink = logLink
      } catch (err) {
        logger.warn(`${openshiftProject} ${jobName}: Error while getting and uploading Logs to S3, Error: ${err}. Continuing without log link in message`)
        meta.logLink = ''
      }
      sendToLagoonLogs('warn', projectName, "", `task:builddeploy-kubernetes:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` cancelled. <${logLink}|Logs>`
      )
      break;

    case "failed":
      try {
        const buildLog = await jobsLogGet()
        const s3UploadResult = await saveBuildLog(jobName, projectName, branchName, buildLog, buildstatus)
        logLink = s3UploadResult.Location
        meta.logLink = logLink
      } catch (err) {
        logger.warn(`${openshiftProject} ${jobName}: Error while getting and uploading Logs to S3, Error: ${err}. Continuing without log link in message`)
        meta.logLink = ''
      }

      sendToLagoonLogs('error', projectName, "", `task:builddeploy-kubernetes:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` failed. <${logLink}|Logs>`
      )
      break;

    case "complete":
      try {
        const buildLog = await jobsLogGet()
        const s3UploadResult = await saveBuildLog(jobName, projectName, branchName, buildLog, buildstatus)
        logLink = s3UploadResult.Location
        meta.logLink = logLink
      } catch (err) {
        logger.warn(`${openshiftProject} ${jobName}: Error while getting and uploading Logs to S3, Error: ${err}. Continuing without log link in message`)
        meta.logLink = ''
      }

      let configMap = {};
      try {
        const configMapSearch = promisify(kubernetesCore.namespaces(openshiftProject).configmaps.get);
        const configMapSearchResult = await configMapSearch({
          qs: {
            fieldSelector: `metadata.name=lagoon-env`
          }
        });
      
        if (!R.isNil(configMapSearchResult)) {
          configMap = configMapSearchResult
        }

        // const configMapGet = Promise.promisify(kubernetes.ns(openshiftProject).configmaps('lagoon-env').get, { context: kubernetes.ns(openshiftProject).configmaps('lagoon-env') })
        // configMap = await configMapGet()
      } catch (err) {
        if (err.code == 404) {
          logger.error(`configmap lagoon-env does not exist, continuing without routes information`)
        } else {
          logger.error(err)
          throw new Error
        }
      }

      const route = configMap.data.ROUTE
      const routes = configMap.data.ROUTES.split(',').filter(e => e !== route);
      meta.route = route
      meta.routes = routes
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-kubernetes:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` complete. <${logLink}|Logs> \n ${route}\n ${routes.join("\n")}`
      )
      try {
        const updateEnvironmentResult = await updateEnvironment(
          environment.id,
          `{
            route: "${configMap.data.LAGOON_ROUTE}",
            routes: "${configMap.data.LAGOON_ROUTES}",
            monitoringUrls: "${configMap.data.LAGOON_MONITORING_URLS}",
            project: ${project.id}
          }`)
        } catch (err) {
          logger.warn(`${openshiftProject} ${jobName}: Error while updating routes in API, Error: ${err}. Continuing without update`)
        }

      // Tell api what services are running in this environment
      try {
        // Get pod template from existing service
        // TODO: This should work but does not


        const deploymentConfigsGet = promisify(kubernetesCore.namespaces(openshiftProject).deployments.get);
        const qs = {
          fieldSelector: `metadata.name=${openshiftProject}`
        };
        const deploymentConfigs = await deployments({});


        // const deploymentConfigsGet = Promise.promisify(
        //   kubernetes.ns(openshiftProject).deploymentconfigs.get, { context: kubernetes.ns(openshiftProject).deploymentconfigs }
        // );


        const deploymentConfigs = await deploymentConfigsGet();

        const serviceNames = deploymentConfigs.items.reduce(
          (names, deploymentConfig) => [
            ...names,
            ...deploymentConfig.spec.template.spec.containers.reduce(
              (names, container) => [
                ...names,
                container.name
              ],
              []
            )
          ],
          []
        );

        await setEnvironmentServices(environment.id, serviceNames);
      } catch (err) {
        logger.error(`${openshiftProject} ${jobName}: Error while updating environment services in API, Error: ${err}`)
      }
      break;

    default:
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-kubernetes:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` phase ${buildPhase}`
      )
      throw new BuildNotCompletedYet(`*[${projectName}]* ${logMessage} Build \`${jobName}\` phase ${buildPhase}`)
      break;
  }

}

const saveBuildLog = async(jobName, projectName, branchName, buildLog, buildStatus) => {
  const meta = {
    jobName,
    branchName,
    buildPhase: buildStatus.status.phase.toLowerCase(),
    remoteId: buildStatus.metadata.uid
  };

  sendToLagoonLogs('info', projectName, "", `build-logs:builddeploy-kubernetes:${jobName}`, meta,
    buildLog
  );
  return await uploadLogToS3(jobName, projectName, branchName, buildLog);
};

const uploadLogToS3 = async (jobName, projectName, branchName, buildLog) => {
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
    jobName,
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

  const task = "task:builddeploy-kubernetes:error";
  const msg = `*[${projectName}]* ${logMessage} Build \`${jobName}\` ERROR: \`\`\` ${lastError} \`\`\``;
  sendToLagoonLogs('error', projectName, "", task,  {}, msg);

}

consumeTaskMonitor('builddeploy-kubernetes', messageConsumer, deathHandler);