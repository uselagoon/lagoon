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
    meta,
   } = JSON.parse(msg.content.toString());


  switch (type) {
    case 'build':
      logger.verbose(
        `Received deployment and environment update task ${meta.buildName} - ${meta.buildPhase}`
      );
      try {
        let deploymentId;
        try {
          // try get the ID from our build UID
          const deployment = await getDeploymentByRemoteId(meta.remoteId);
          if (!deployment.deploymentByRemoteId) {
            // otherwise find it using the build name
            const deploymentResult = await getDeploymentByName(namespace, meta.buildName);
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
          remoteId: meta.remoteId,
          status: meta.buildPhase.toUpperCase(),
          started: dateOrNull(meta.startTime),
          completed: dateOrNull(meta.endTime),
        });
      } catch (error) {
        logger.error(`Could not update deployment ${meta.project} ${meta.Buildname}. Message: ${error}`);
      }


      let environment;
      let project;
      try {
        const projectResult = await getOpenShiftInfoForProject(meta.project);
        project = projectResult.project

        const environmentResult = await getEnvironmentByName(meta.environment, project.id)
        environment = environmentResult.environmentByName
      } catch (err) {
        logger.warn(`${namespace} ${meta.buildName}: Error while getting project or environment information, Error: ${err}. Continuing without update`)
      }

      try {
        const updateEnvironmentResult = await updateEnvironment(
          environment.id,
          `{
            openshiftProjectName: "${namespace}",
          }`
        );
      } catch (err) {
        logger.warn(`${namespace} ${meta.buildName}: Error while updating routes in API, Error: ${err}. Continuing without update`)
      }
      // Update GraphQL API if the Environment has completed or failed
      switch (meta.buildPhase) {
        case 'complete':
        case 'failed':
          try {
            const updateEnvironmentResult = await updateEnvironment(
              environment.id,
              `{
                route: "${meta.route}",
                routes: "${meta.routes}",
                monitoringUrls: "${meta.monitoringUrls}",
                project: ${project.id}
              }`
            );
          } catch (err) {
            logger.warn(`${namespace} ${meta.buildName}: Error while updating routes in API, Error: ${err}. Continuing without update`)
          }
      }
      break;
    case 'remove':
      logger.verbose(`Received remove task for ${namespace}`);
      // Update GraphQL API that the Environment has been deleted
      try {
        await deleteEnvironment(meta.environment, meta.project, false);
        logger.info(
          `${meta.project}: Deleted Environment '${meta.environment}' in API`
        );
        meta.openshiftProject = meta.environment
        meta.openshiftProjectName = namespace
        meta.projectName = meta.project
        sendToLagoonLogs(
          'success',
          meta.project,
          '',
          'task:remove-kubernetes:finished',
          meta,
          `*[${meta.project}]* remove \`${meta.environment}\``
        );
      } catch (err) {
        logger.warn(`${namespace}: Error while deleting environment, Error: ${err}. Continuing without update`)
      }
      break;
  }
};

const deathHandler = async (msg, lastError) => {
  const {
    type,
    namespace,
    meta,
  } = JSON.parse(msg.content.toString());

  sendToLagoonLogs(
    'error',
    meta.project,
    '',
    'task:remove-kubernetes:error', //@TODO: this probably needs to be changed to a new event type for the operator to use
    {},
    `*[${meta.project}]* remove \`${namespace}\` ERROR:
\`\`\`
${lastError}
\`\`\``
  );
};

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {
  return;
};

consumeTasks('operator', messageConsumer, retryHandler, deathHandler);
