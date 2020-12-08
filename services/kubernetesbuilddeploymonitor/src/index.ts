import { promisify } from 'util';
import kubernetesClient from 'kubernetes-client';
import R from 'ramda';
import moment from 'moment';
import { logger } from '@lagoon/commons/dist/local-logging';

import {
  getOpenShiftInfoForProject,
  getEnvironmentByName,
  updateEnvironment,
  getDeploymentByRemoteId,
  getDeploymentByName,
  updateDeployment,
  setEnvironmentServices,
} from '@lagoon/commons/dist/api';

import { sendToLagoonLogs, initSendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { consumeTaskMonitor, initSendToLagoonTasks } from '@lagoon/commons/dist/tasks';

class BuildNotCompletedYet extends Error {
  constructor(message) {
    super(message);
    this.name = 'BuildNotCompletedYet';
  }
}

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

  let deploymentResult;
  let deployment;
  try {
    deploymentResult = await getDeploymentByName(openshiftProject, jobName);
    deployment = deploymentResult.environment.deployments[0];
  }catch(error) {
    logger.warn(`Error while fetching deployment openshiftproject: ${openshiftProject}: ${error}`)
    throw(error)
  }

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
    // @ts-ignore
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
    // @ts-ignore
    jobInfo = await jobsGet();
  } catch (err) {
    if (err.code == 404) {
      logger.error(`Job ${jobName} does not exist, bailing`);
      return;
    } else {
      logger.error(err);
      throw new Error();
    }
  }


  const jobsLogGet = async () => {
    // First fetch the pod(s) used to run this job
    const podsGet = promisify(kubernetesCore.namespaces(openshiftProject).pods.get);
    // @ts-ignore
    const pods: any = await podsGet({
      qs: {
        labelSelector: `job-name=${jobName}`
      }
    });
    const podNames = pods.items.map(pod => pod.metadata.name);

    // Combine all logs from all pod(s)
    let finalLog = '';
    for (const podName of podNames) {
      const podLogGet = promisify(kubernetesCore.namespaces(openshiftProject).pods(podName).log.get)
      // @ts-ignore
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
    const dateOrNull = R.unless(R.isNil, convertDateFormat) as any;

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

    let completedTime = jobInfo.status.completionTime
    if (status == 'failed') {
      // failed jobs in kubernetes don't have a completionTime in them
      // the status conditions will have a lastTransitionTime in them that will contain the state the job went into
      // since jobs only have 1 attempt, there shouldn't be any other conditions
      completedTime = jobInfo.status.conditions[0].lastTransitionTime
    }

    await updateDeployment(deployment.deploymentByRemoteId.id, {
      status: status.toUpperCase(),
      started: dateOrNull(jobInfo.status.startTime),
      completed: dateOrNull(completedTime),
    });
  } catch (error) {
    logger.error(`Could not update deployment ${projectName} ${jobName}. Message: ${error}`);
  }

  const meta = JSON.parse(msg.content.toString())
  const logLink = deployment.uiLink;
  meta.logLink = deployment.uiLink;
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
        await saveBuildLog(jobName, projectName, branchName, buildLog, status, jobInfo.metadata.uid)
      } catch (err) {
        logger.warn(`${projectName} ${jobName}: Error while getting and sending to lagoon-logs, Error: ${err}.`)
      }
      sendToLagoonLogs('error', projectName, "", `task:builddeploy-kubernetes:${status}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${jobName}\` failed. <${logLink}|Logs>`
      )
      break;

    case "complete":
      try {
        const buildLog = await jobsLogGet()
        await saveBuildLog(jobName, projectName, branchName, buildLog, status, jobInfo.metadata.uid)
      } catch (err) {
        logger.warn(`${projectName} ${jobName}: Error while getting and sending to lagoon-logs, Error: ${err}.`)
      }
      let configMap: any = {};
      try {
        const configMapSearch = promisify(kubernetesCore.namespaces(openshiftProject).configmaps.get);
        // @ts-ignore
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
        // @ts-ignore
        const pods: any = await podsGet()

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
};

const deathHandler = async (msg, lastError) => {
  const {
    buildName: jobName,
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
      `Could not update deployment ${projectName} ${jobName}. Message: ${error}`
    );
  }

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
