const promisify = require('util').promisify;
import R from 'ramda';
import { logger } from '@lagoon/commons/dist/local-logging';
import {
  sendToLagoonLogs,
  initSendToLagoonLogs
} from '@lagoon/commons/dist/logs';
import {
  consumeTasks,
  initSendToLagoonTasks
} from '@lagoon/commons/dist/tasks';
import {
  getOpenShiftInfoForProject,
  getEnvironmentByName,
  updateEnvironment,
  updateDeployment,
  getDeploymentByName,
  getDeploymentByRemoteId,
  deleteEnvironment
} from '@lagoon/commons/dist/api';

initSendToLagoonLogs();
initSendToLagoonTasks();

const ocsafety = string =>
  string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

const messageConsumer = async function(msg) {
  const {
    type,
    namespace,
    buildInfo,
   } = JSON.parse(msg.content.toString());


  switch (type) {
    case 'build':
      logger.verbose(
        `Received deployment and environment update task ${buildInfo.buildName} - ${buildInfo.buildPhase}`
      );
      try {
        let deploymentId;
        try {
          // try get the ID from our build UID
          const deployment = await getDeploymentByRemoteId(buildInfo.jobUid);
          if (!deployment.deploymentByRemoteId) {
            // otherwise find it using the build name
            const deploymentResult = await getDeploymentByName(namespace, buildInfo.buildName);
            deploymentId = deploymentResult.environment.deployments[0].id;
          } else {
            deploymentId = deployment.deploymentByRemoteId.id
          }
        }catch(error) {
          logger.warn(`Error while fetching deployment openshiftproject: ${namespace}: ${error}`)
          throw(error)
        }

        const convertDateFormat = R.init;
        const dateOrNull = R.unless(R.isNil, convertDateFormat) as any;

        await updateDeployment(deploymentId, {
          remoteId: buildInfo.jobUid,
          status: buildInfo.buildPhase.toUpperCase(),
          started: dateOrNull(buildInfo.startTime),
          completed: dateOrNull(buildInfo.endTime),
        });
      } catch (error) {
        logger.error(`Could not update deployment ${buildInfo.project} ${buildInfo.Buildname}. Message: ${error}`);
      }

      const projectResult = await getOpenShiftInfoForProject(buildInfo.project);
      const project = projectResult.project

      const environmentResult = await getEnvironmentByName(buildInfo.environment, project.id)
      const environment = environmentResult.environmentByName

      try {
        const updateEnvironmentResult = await updateEnvironment(
          environment.id,
          `{
            openshiftProjectName: "${namespace}",
          }`
        );
      } catch (err) {
        logger.warn(`${namespace} ${buildInfo.buildName}: Error while updating routes in API, Error: ${err}. Continuing without update`)
      }
      // Update GraphQL API if the Environment has completed or failed
      switch (buildInfo.buildPhase) {
        case 'complete':
        case 'failed':
          try {
            const updateEnvironmentResult = await updateEnvironment(
              environment.id,
              `{
                route: "${buildInfo.route}",
                routes: "${buildInfo.routes}",
                monitoringUrls: "${buildInfo.monitoringUrls}",
                project: ${project.id}
              }`
            );
          } catch (err) {
            logger.warn(`${namespace} ${buildInfo.buildName}: Error while updating routes in API, Error: ${err}. Continuing without update`)
          }
      }
      break;
    case 'remove':
        logger.verbose(`Received remove task for ${namespace}`);
        // Update GraphQL API that the Environment has been deleted
        await deleteEnvironment(buildInfo.environment, buildInfo.project, false);
        logger.info(
          `${namespace}: Deleted Environment '${buildInfo.environment}' in API`
        );
      break;
  }
};

const deathHandler = async (msg, lastError) => {
  const {
    type,
    namespace,
    buildInfo,
  } = JSON.parse(msg.content.toString());

  sendToLagoonLogs(
    'error',
    buildInfo.project,
    '',
    'task:remove-kubernetes:error', //@TODO: this probably needs to be changed to a new event type for the operator to use
    {},
    `*[${buildInfo.project}]* remove \`${namespace}\` ERROR:
\`\`\`
${lastError}
\`\`\``
  );
};

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {
  return;
};

consumeTasks('operator', messageConsumer, retryHandler, deathHandler);
