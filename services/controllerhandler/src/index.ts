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
  getEnvironmentById,
  updateEnvironment,
  updateDeployment,
  getDeploymentByName,
  getDeploymentByRemoteId,
  setEnvironmentServices,
  deleteEnvironment,
  updateTask,
  updateProject
} from '@lagoon/commons/dist/api';

initSendToLagoonLogs();
initSendToLagoonTasks();

const ocsafety = string =>
  string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

const decode = (str: string):string => Buffer.from(str, 'base64').toString('binary');

const updateLagoonTask = async (meta) => {
  // Update lagoon task
  try {
    const convertDateFormat = R.init;
    const dateOrNull = R.unless(R.isNil, convertDateFormat) as any;
    let completedDate = dateOrNull(meta.endTime) as any;

    if (meta.jobStatus === 'failed') {
      completedDate = dateOrNull(meta.endTime);
    }

    // transform the jobstatus into one the API knows about
    let jobStatus = 'active';
    switch (meta.jobStatus) {
      case 'pending':
        jobStatus = 'active'
        break;
      case 'running':
        jobStatus = 'active'
        break;
      case 'complete':
        jobStatus = 'succeeded'
        break;
      default:
        jobStatus = meta.jobStatus
        break;
    }
    // update the actual task now
    await updateTask(Number(meta.task.id), {
      remoteId: meta.remoteId,
      status: jobStatus.toUpperCase(),
      started: dateOrNull(meta.startTime),
      completed: completedDate
    });
  } catch (error) {
    logger.error(
      `Could not update task ${meta.project} ${meta.jobName} ${meta.remoteId}. Message: ${error}`
    );
  }
}

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
          if (meta.remoteId != null) {
            // otherwise, get the build directly by the remote id
            // and fall back again to checking by namespace and build name if that fails
            const deployment = await getDeploymentByRemoteId(meta.remoteId);
            if (!deployment.deploymentByRemoteId) {
              // otherwise find it using the build name
              const deploymentResult = await getDeploymentByName(namespace, meta.buildName);
              deploymentId = deploymentResult.environment.deployments[0].id;
            } else {
              deploymentId = deployment.deploymentByRemoteId.id
            }
          } else {
            // if there is no remoteId in the message, then we are probably cancelling a build that
            // was not actually ever started in a lagoon cluster
            // so get the deployment id based on namespace and build name
            const deploymentResult = await getDeploymentByName(namespace, meta.buildName);
            deploymentId = deploymentResult.environment.deployments[0].id;
          }
        } catch(error) {
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
        // check if the payload has an environment id defined to get the environment information
        if (meta.environmentId != null) {
          const environmentResult = await getEnvironmentById(meta.environmentId)
          environment = environmentResult.environmentByName
        } else {
          // if no id, use the name that was provided instead
          const environmentResult = await getEnvironmentByName(meta.environment, project.id)
          environment = environmentResult.environmentByName
        }
      } catch (err) {
        // if the project or environment can't be determined, give up trying to do anything for it
        logger.error(`${namespace} ${meta.buildName}: Error while getting project or environment information, Error: ${err}. Will not continue`)
        throw new Error
      }

      try {
        await updateEnvironment(
          environment.id,
          `{
            openshiftProjectName: "${namespace}",
          }`
        );
      } catch (err) {
        logger.warn(`${namespace} ${meta.buildName}: Error while updating openshiftProjectName in API, Error: ${err}. Continuing without update`)
      }
      // Update GraphQL API if the Environment has completed or failed
      switch (meta.buildPhase) {
        case 'complete':
        case 'failed':
        case 'cancelled':
          try {
            // update the environment with the routes etc
            await updateEnvironment(
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
          try {
            // update the environment with the services available
            await setEnvironmentServices(environment.id, meta.services);
          } catch (err) {
            logger.warn(`${namespace} ${meta.buildName}: Error while updating services in API, Error: ${err}. Continuing without update`)
          }
      }
      break;
    case 'remove':
      logger.verbose(`Received remove task for ${namespace}`);
      // Update GraphQL API that the Environment has been deleted
      try {
        await deleteEnvironment(environment.name, meta.project, false);
        logger.info(
          `${meta.project}: Deleted Environment '${environment.name}' in API`
        );
        // @TODO: looking at `meta.openshiftProject`, this seems to only be used by logs2email, logs2rocketchat, and logs2microsoftteams
        // when notification system is re-written, this can also be removed as it seems kind of a silly name
        meta.openshiftProject = environment.name
        meta.openshiftProjectName = namespace
        meta.projectName = meta.project
        sendToLagoonLogs(
          'success',
          meta.project,
          '',
          'task:remove-kubernetes:finished',
          meta,
          `*[${meta.project}]* remove \`${environment.name}\``
        );
      } catch (err) {
        logger.warn(`${namespace}: Error while deleting environment, Error: ${err}. Continuing without update`)
      }
      break;
    case 'task':
      logger.verbose(
        `Received task result for ${meta.task.name} from ${meta.project} - ${environment.name} - ${meta.jobStatus}`
      );
      // if we want to be able to do something else when a task result comes through,
      // we can use the task key
      switch (meta.key) {
        // since the route migration uses the `advanced task` system, we can do something with the data
        // that we get back from the controllers
        case "kubernetes:route:migrate":
          switch (meta.jobStatus) {
            case "succeeded":
              try {
                // get the project ID
                const projectResult = await getOpenShiftInfoForProject(meta.project);
                const project = projectResult.project
                // since the advanceddata contains a base64 encoded value, we have to decode it first
                var decodedData = new Buffer(meta.advancedData, 'base64').toString('ascii')
                const taskResult = JSON.parse(decodedData)
                // the returned data for a route migration is specific to this task, so we use the values contained
                // to do something in the api
                // in the response, we want to swap these around, so production becomes standby
                // standby becomes production
                const response = await updateProject(project.id, {
                  productionEnvironment: taskResult.standbyProductionEnvironment,
                  standbyProductionEnvironment: taskResult.productionEnvironment,
                  productionRoutes: taskResult.productionRoutes,
                  standbyRoutes: taskResult.standbyRoutes,
                });
              } catch (err) {
                logger.warn(`${namespace}: Error while updating project, Error: ${err}. Continuing without update`)
              }
          }
          break;
        }
        // since the logging and other stuff is all sent via the controllers directly to message queues
        // we only need to update the task here with the status
        await updateLagoonTask(meta)
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
    'task:remove-kubernetes:error', //@TODO: this probably needs to be changed to a new event type for the controllers to use?
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

consumeTasks('controller', messageConsumer, retryHandler, deathHandler);
