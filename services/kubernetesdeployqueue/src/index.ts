const promisify = require('util').promisify;
import KubernetesClient from 'kubernetes-client';
import R from 'ramda';
import moment from 'moment';
import { logger } from '@lagoon/commons/dist/local-logging';
import {
  graphqlapi,
  getOpenShiftInfoForProject,
  updateDeployment
} from '@lagoon/commons/dist/api';

import {
  sendToLagoonLogs,
  initSendToLagoonLogs
} from '@lagoon/commons/dist/logs';
import {
  consumeTaskMonitor,
  initSendToLagoonTasks,
  createTaskMonitor
} from '@lagoon/commons/dist/tasks';

initSendToLagoonLogs();
initSendToLagoonTasks();

class AnotherBuildAlreadyRunning extends Error {
  constructor(message) {
    super(message);
    this.name = 'AnotherBuildAlreadyRunning';
  }
}

class BuildOutOfOrder extends Error {
  delayFn: (retryCount: number) => number;

  constructor(message) {
    super(message);
    this.name = 'BuildOutOfOrder';
    // Wait 30 seconds before checking again.
    this.delayFn = () => 30;
  }
}

const getEnvironmentDeployments = async (
  openshiftProjectName: string
): Promise<any[]> => {
  const result = await graphqlapi.query(
    `
    query getEnvironmentDeployments($openshiftProjectName: String!) {
      environmentByOpenshiftProjectName(openshiftProjectName: $openshiftProjectName) {
        deployments {
          name
          status
          created
        }
      }
    }`,
    { openshiftProjectName }
  );

  return R.pathOr(
    [],
    ['environmentByOpenshiftProjectName', 'deployments'],
    result
  );
};

const filterByNewStatus = R.filter(R.propEq('status', 'new'));
const sortByCreatedDate = R.sort(R.ascend(R.prop('created')));
const oldestNewDeployment = R.pipe(
  filterByNewStatus,
  sortByCreatedDate,
  R.head
);

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

  const deployments = await getEnvironmentDeployments(openshiftProject);
  const nextDeploymentToRun = oldestNewDeployment(deployments);

  if (R.prop('name', nextDeploymentToRun) !== buildName) {
    const msg = `The build "${buildName}" is not next in line for project "${openshiftProject}"`;
    logger.debug(msg);
    throw new BuildOutOfOrder(msg);
  }

  // Check that there are no active builds in this namespace running
  let activeBuilds;
  try {
    const jobsGetAll = promisify(
      kubernetesBatchApi.namespaces(openshiftProject).jobs.get
    );
    const namespaceJobs = await jobsGetAll({
      qs: {
        labelSelector: 'lagoon.sh/jobType=build'
      }
    });
    activeBuilds = R.pipe(
      R.propOr([], 'items'),
      R.filter(R.pathSatisfies(R.lt(0), ['status', 'active']))
    )(namespaceJobs);
  } catch (err) {
    logger.error(
      `${openshiftProject}: Unexpected error loading current running Jobs, unable to build ${buildName}: ${err}`
    );
    return;
  }

  if (!R.isEmpty(activeBuilds)) {
    const msg = `${openshiftProject}: ${buildName} is waiting on ${activeBuilds.length} active builds`;
    logger.debug(msg);
    throw new AnotherBuildAlreadyRunning(msg);
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
    sha,
    deployment: {
      ...deployment,
      status: 'PENDING',
      remoteId: jobInfo.metadata.uid,
    }
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
    branchName,
    sha,
    deployment
  } = JSON.parse(msg.content.toString());

  // Don't leave the deployment in an active state
  try {
    const now = moment.utc();
    await updateDeployment(deployment.id, {
      status: 'ERROR',
      completed: now.format('YYYY-MM-DDTHH:mm:ss'),
    });
  } catch (error) {
    logger.error(
      `Could not update deployment ${projectName} ${buildName}. Message: ${error}`
    );
  }

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
