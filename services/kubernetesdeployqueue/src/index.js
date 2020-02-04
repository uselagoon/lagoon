const promisify = require('util').promisify;
const KubernetesClient = require('kubernetes-client');
const sleep = require('es7-sleep');
const R = require('ramda');
const sha1 = require('sha1');
const crypto = require('crypto');
const { logger } = require('@lagoon/commons/src/local-logging');
const {
  getOpenShiftInfoForProject,
  addOrUpdateEnvironment,
  getEnvironmentByName,
  updateDeployment
} = require('@lagoon/commons/src/api');

const {
  sendToLagoonLogs,
  initSendToLagoonLogs
} = require('@lagoon/commons/src/logs');
const {
  consumeTaskMonitor,
  initSendToLagoonTasks,
  createTaskMonitor
} = require('@lagoon/commons/src/tasks');

initSendToLagoonLogs();
initSendToLagoonTasks();

const messageConsumer = async msg => {
  const {
    buildName,
    projectName,
    openshiftProject,
    branchName,
    sha,
    jobConfig,
    deployment
  } = JSON.parse(msg.content.toString());

  logger.verbose(
    `Received QueueDeployKubernetes task for project: ${projectName}, branch: ${branchName}, sha: ${sha}, build: ${buildName}`
  );

  const result = await getOpenShiftInfoForProject(projectName);
  const projectOpenShift = result.project;

  const ocsafety = string =>
    string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

  try {
    var openshiftConsole = projectOpenShift.openshift.consoleUrl.replace(
      /\/$/,
      ''
    );
    var openshiftToken = projectOpenShift.openshift.token || '';
    var gitSha = sha;
  } catch (error) {
    logger.error(`Error while loading information for project ${projectName}`);
    logger.error(error);
    throw error;
  }

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  const kubernetesApi = new KubernetesClient.Api({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });

  const kubernetesBatchApi = new KubernetesClient.Batch({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });

  // Check for currently active builds
  let activeBuilds;
  try {
    const jobsGet = promisify(
      kubernetesBatchApi.namespaces(openshiftProject).jobs.get
    );
    namespaceJobs = await jobsGet();

    activeBuilds = R.pipe(
      R.propOr([], 'items'),
      R.filter(R.pathSatisfies(R.lt(0), ['status', 'active'])),
    )(namespaceJobs);
  } catch (err) {
    logger.error(
      `${openshiftProject}: Unexpected error loading jobs, unable to build ${buildName}: ${err}`
    );
    return;
  }

  // If there are current builds running, delay this one
  if (!R.isEmpty(activeBuilds)) {
    logger.info(`Delaying build of ${buildName} due to ${activeBuilds.length} pending builds`);
    throw new Error('requeue');
  }

  // Load job, if not exists create
  let jobInfo;
  try {
    const jobsGet = promisify(
      kubernetesBatchApi.namespaces(openshiftProject).jobs(buildName).get
    );
    jobInfo = await jobsGet();
    logger.info(`${openshiftProject}: Build ${buildName} already exists`);
  } catch (err) {
    if (err.code == 404) {
      try {
      const jobPost = promisify(
        kubernetesApi.group(jobConfig).ns(openshiftProject).jobs.post
      );
        console.log(JSON.stringify(jobConfig, null, 4));

      jobInfo = await jobPost({ body: jobConfig });
      logger.info(`${openshiftProject}: Created build ${buildName}`);
      } catch (error) {
        logger.error(
          `${openshiftProject}: Unexpected error creating job ${buildName}: ${err}`
        );
        throw new Error('requeue');
      }
    } else {
      logger.error(
        `${openshiftProject}: Unexpected error loading job, unable to build ${buildName}: ${err}`
      );
      return;
    }
  }

  const jobName = jobInfo.metadata.name;

  // Update the deployment with the job id
  try {
    await updateDeployment(deployment.id, {
      status: 'PENDING',
      remoteId: jobInfo.metadata.uid
    });
  } catch (error) {
    logger.error(
      `Could not update deployment ${projectName} ${buildName}. Message: ${error}`
    );
  }

  const monitorPayload = {
    buildName: jobName,
    projectName,
    openshiftProject,
    branchName,
    sha
  };

  const taskMonitorLogs = await createTaskMonitor(
    'builddeploy-kubernetes',
    monitorPayload
  );

  let logMessage = '';
  if (gitSha) {
    logMessage = `\`${branchName}\` (${buildName})`;
  } else {
    logMessage = `\`${branchName}\``;
  }

  sendToLagoonLogs(
    'start',
    projectName,
    '',
    'task:builddeploy-kubernetes:start',
    {},
    `*[${projectName}]* ${logMessage}`
  );
};

const deathHandler = async (msg, lastError) => {
  const {
    buildName,
    projectName,
    openshiftProject,
    branchName,
    sha,
    jobConfig
  } = JSON.parse(msg.content.toString());

  let logMessage = '';
  if (sha) {
    logMessage = `\`${branchName}\` (${sha.substring(0, 7)})`;
  } else {
    logMessage = `\`${branchName}\``;
  }

  const task = 'task:builddeploy-kubernetes:error';
  const errorMsg = `*[${projectName}]* ${logMessage} Build \`${buildName}\` ERROR: \`\`\` ${lastError} \`\`\``;
  sendToLagoonLogs('error', projectName, '', task, {}, errorMsg);
};

consumeTaskMonitor('queuedeploy-kubernetes', messageConsumer, deathHandler);
