import { promisify } from 'util';
import OpenShiftClient from 'openshift-client';
import R from 'ramda';
import { logger } from '@lagoon/commons/dist/local-logging';
import {
  getOpenShiftInfoForProject,
  getEnvironmentByName,
  updateEnvironment,
  getDeploymentByRemoteId,
  getDeploymentByName,
  updateDeployment,
  updateProject,
  setEnvironmentServices,
} from '@lagoon/commons/dist/api';

import { sendToLagoonLogs, initSendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { consumeTaskMonitor, initSendToLagoonTasks } from '@lagoon/commons/dist/tasks';

class BuildNotCompletedYet extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BuildNotCompletedYet';
  }
}

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
  const projectResult = await getOpenShiftInfoForProject(projectName);
  const project = projectResult.project

  const environmentResult = await getEnvironmentByName(branchName, project.id)
  const environment = environmentResult.environmentByName

  const deploymentResult = await getDeploymentByName(openshiftProject, buildName);
  const deployment = deploymentResult.environment.deployments[0];

  try {
    var gitSha = sha
    var openshiftConsole = project.openshift.consoleUrl.replace(/\/$/, "");
    var openshiftToken = project.openshift.token || ""
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
  openshift.ns.addResource('deploymentconfigs');

  let projectStatus = {}
  try {
    const projectsGet = promisify(openshift.projects(openshiftProject).get)
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

  let buildstatus: any
  try {
    const buildsGet = promisify(openshift.ns(openshiftProject).builds(buildName).get)
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



  const buildPhase = buildstatus.status.phase.toLowerCase();
  const buildsLogGet = promisify(openshift.ns(openshiftProject).builds(`${buildName}/log`).get)
  const routesGet = promisify(openshift.ns(openshiftProject).routes.get)

  try {
    const deployment = await getDeploymentByRemoteId(buildstatus.metadata.uid);
    if (!deployment.deploymentByRemoteId) {
      throw new Error(`No deployment found with remote id ${buildstatus.metadata.uid}`);
    }

    const convertDateFormat = R.init;
    const dateOrNull = R.unless(R.isNil, convertDateFormat) as any;

    await updateDeployment(deployment.deploymentByRemoteId.id, {
      status: buildstatus.status.phase.toUpperCase(),
      created: convertDateFormat(buildstatus.metadata.creationTimestamp),
      started: dateOrNull(buildstatus.status.startTimestamp),
      completed: dateOrNull(buildstatus.status.completionTimestamp),
    });
  } catch (error) {
    logger.error(`Could not update deployment ${projectName} ${buildName}. Message: ${error}`);
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
      sendToLagoonLogs('warn', projectName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${buildName}\` cancelled. <${logLink}|Logs>`
      )
      break;

    case "failed":
      try {
        const buildLog = await buildsLogGet()
        await saveBuildLog(buildName, projectName, branchName, buildLog, buildstatus)
      } catch (err) {
        logger.warn(`${openshiftProject} ${buildName}: Error while getting and sending to lagoon-logs, Error: ${err}.`)
      }
      sendToLagoonLogs('error', projectName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${buildName}\` failed. <${logLink}|Logs>`
      )
      break;

    case "complete":
      try {
        const buildLog = await buildsLogGet()
        await saveBuildLog(buildName, projectName, branchName, buildLog, buildstatus)
      } catch (err) {
        logger.warn(`${openshiftProject} ${buildName}: Error while getting and sending to lagoon-logs, Error: ${err}.`)
      }

      let configMap: any
      try {
        const configMapGet = promisify(kubernetes.ns(openshiftProject).configmaps('lagoon-env').get)
        configMap = await configMapGet()
      } catch (err) {
        if (err.code == 404) {
          logger.error(`configmap lagoon-env does not exist, continuing without routes information`)
        } else {
          logger.error(err)
          throw new Error
        }
      }

      const route = configMap.data.LAGOON_ROUTE
      const routes = configMap.data.LAGOON_ROUTES.split(',').filter(e => e !== route);
      meta.route = route
      meta.routes = routes
      sendToLagoonLogs('info', projectName, "", `task:builddeploy-openshift:${buildPhase}`, meta,
        `*[${projectName}]* ${logMessage} Build \`${buildName}\` complete. <${logLink}|Logs> \n ${route}\n ${routes.join("\n")}`
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
        logger.warn(`${openshiftProject} ${buildName}: Error while updating routes in API, Error: ${err}. Continuing without update`)
      }

      //update the active/standby routes in the api
      try {
        if (project.productionEnvironment == environment.name) {
          const updateProjectResult = await updateProject(project.id, {
            productionRoutes: configMap.data.LAGOON_ACTIVE_ROUTES,
          });
        } else if (project.standbyProductionEnvironment == environment.name){
          const updateProjectResult = await updateProject(project.id, {
            standbyRoutes: configMap.data.LAGOON_STANDBY_ROUTES,
          });
        }
      } catch (err) {
        logger.warn(`${openshiftProject} ${buildName}: Error while updating active/standby routes in API, Error: ${err}. Continuing without update`)
      }

      // Tell api what services are running in this environment
      try {
        // Get pod template from existing service
        const deploymentConfigsGet = promisify(openshift.ns(openshiftProject).deploymentconfigs.get);
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
        logger.error(`${openshiftProject} ${buildName}: Error while updating environment services in API, Error: ${err}`)
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

const saveBuildLog = async(buildName, projectName, branchName, buildLog, buildStatus) => {
  const meta = {
    buildName,
    branchName,
    buildPhase: buildStatus.status.phase.toLowerCase(),
    remoteId: buildStatus.metadata.uid
  };
  sendToLagoonLogs('info', projectName, "", `build-logs:builddeploy-openshift:${buildName}`, meta,
    buildLog
  );
}

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
