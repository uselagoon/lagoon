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
  constructor(message) {
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

  logger.verbose(`Received builddeploy-kubernetes monitoring task for project: ${projectName}, jobName: ${jobName}, openshiftProject: ${openshiftProject}, branch: ${branchName}, sha: ${sha}`);

  const projectResult = await getOpenShiftInfoForProject(projectName);
  const project = projectResult.project

  const environmentResult = await getEnvironmentByName(branchName, project.id)
  const environment = environmentResult.environmentByName

  try {
    var gitSha = sha
    var kubernetesConsole = project.openshift.consoleUrl.replace(/\/$/, "");
    var kubernetesToken = project.openshift.token || ""
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

  const kubernetesBatchApi = new kubernetesClient.Batch({
    url: kubernetesConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: kubernetesToken
    }
  });

  // Check if project exists
  try {
    const namespacesSearch = promisify(kubernetesCore.namespaces.get);
    const namespacesResult = await namespacesSearch({
      qs: {
        fieldSelector: `metadata.name=${openshiftProject}`
      }
    });
    const namespaces = R.propOr([], 'items', namespacesResult);

    // An empty list means the namespace does not exist
    if (R.isEmpty(namespaces)) {
      logger.error(`Project ${openshiftProject} does not exist, bailing`)
      return; // we are done here
    }
  } catch (err) {
    logger.error(err);
    throw new Error();
  }

  let jobInfo;
  try {
    const jobsGet = promisify(kubernetesBatchApi.namespaces(openshiftProject).jobs(jobName).get);
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


  const jobsLogGet = async () => {
    // First fetch the pod(s) used to run this job
    const podsGet = promisify(kubernetesCore.namespaces(openshiftProject).pods.get);
    const pods = await podsGet({
      qs: {
        labelSelector: `job-name=${jobName}`
      }
    });
    const podNames = pods.items.map(pod => pod.metadata.name);

    // Combine all logs from all pod(s)
    let finalLog = '';
    for (const podName of podNames) {
      const podLogGet = promisify(kubernetesCore.namespaces(openshiftProject).pods(podName).log.get)
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

  let status;
  try {
    const deployment = await getDeploymentByRemoteId(jobInfo.metadata.uid);

    if (!deployment.deploymentByRemoteId) {
      throw new Error(`No deployment found with remote id ${jobInfo.metadata.uid}`);
    }

    const convertDateFormat = R.init;
    const dateOrNull = R.unless(R.isNil, convertDateFormat);

    // The status needs a mapping from k8s job status (active, succeeded, failed) to api deployment statuses (new, pending, running, cancelled, error, failed, complete)
    status = ((status) => {
      switch (status) {
        case 'active':
          return 'running';
        case 'complete':
          return 'complete';
        case 'failed':
        default:
          return 'failed';
      }
    })(jobInfo.status.active ? 'active' : jobInfo.status.conditions[0].type.toLowerCase());

    await updateDeployment(deployment.deploymentByRemoteId.id, {
      status: status.toUpperCase(),
      created: convertDateFormat(jobInfo.metadata.creationTimestamp),
      started: dateOrNull(jobInfo.status.startTime),
      completed: dateOrNull(jobInfo.metadata.completionTimestamp),
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

  switch (status) {
    case "running":
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-kubernetes:${status}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` running`
      )
      throw new BuildNotCompletedYet(`*[${projectName}]* ${logMessage} Build \`${jobName}\` running`)
      break;

    case "failed":
      try {
        const buildLog = await jobsLogGet()
        const s3UploadResult = await saveBuildLog(jobName, projectName, branchName, buildLog, status, jobInfo.metadata.uid)
        logLink = s3UploadResult.Location
        meta.logLink = logLink
      } catch (err) {
        logger.warn(`${openshiftProject} ${jobName}: Error while getting and uploading Logs to S3, Error: ${err}. Continuing without log link in message`)
        meta.logLink = ''
      }

      sendToLagoonLogs('error', projectName, "", `task:builddeploy-kubernetes:${status}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` failed. <${logLink}|Logs>`
      )
      break;

    case "complete":
      try {
        const buildLog = await jobsLogGet()
        const s3UploadResult = await saveBuildLog(jobName, projectName, branchName, buildLog, status, jobInfo.metadata.uid)
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
      } catch (err) {
        if (err.code == 404) {
          logger.error(`configmap lagoon-env does not exist, continuing without routes information`)
        } else {
          logger.error(err)
          throw new Error
        }
      }

      const route = configMap.items[0].data.LAGOON_ROUTE
      const routes = configMap.items[0].data.LAGOON_ROUTES.split(',').filter(e => e !== route);
      meta.route = route
      meta.routes = routes
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-kubernetes:${status}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` complete. <${logLink}|Logs> \n ${route}\n ${routes.join("\n")}`
      )
      try {
        const updateEnvironmentResult = await updateEnvironment(
          environment.id,
          `{
            route: "${configMap.items[0].data.LAGOON_ROUTE}",
            routes: "${configMap.items[0].data.LAGOON_ROUTES}",
            monitoringUrls: "${configMap.items[0].data.LAGOON_MONITORING_URLS}",
            project: ${project.id}
          }`
        );
      } catch (err) {
        logger.warn(`${openshiftProject} ${jobName}: Error while updating routes in API, Error: ${err}. Continuing without update`)
      }

      // Tell api what services are running in this environment
      try {

        // TODO: Using Deployments may be better

        /*
          const deploymentConfigsGet = promisify(kubernetesApi.namespaces(openshiftProject).deployments.get);
          const deploymentConfigs = await deployments({});

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
        */

        const podsGet = promisify(kubernetesCore.namespaces(openshiftProject).pods.get)
        const pods = await podsGet()

        const serviceNames = pods.items.reduce(
          (names, pod) => [
            ...names,
            ...pod.spec.containers.reduce(
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
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-kubernetes:${status}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` phase ${status}`
      )
      throw new BuildNotCompletedYet(`*[${projectName}]* ${logMessage} Build \`${jobName}\` phase ${status}`)
      break;
  }
}

const saveBuildLog = async(jobName, projectName, branchName, buildLog, status, remoteId) => {
  const meta = {
    jobName,
    branchName,
    buildPhase: status,
    remoteId
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
  const s3Upload = promisify(s3.upload, { context: s3 })
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
  const errorMsg = `*[${projectName}]* ${logMessage} Build \`${jobName}\` ERROR: \`\`\` ${lastError} \`\`\``;
  sendToLagoonLogs('error', projectName, "", task,  {}, errorMsg);

}

consumeTaskMonitor('builddeploy-kubernetes', messageConsumer, deathHandler);