import * as R from 'ramda';
import {
  connect,
  AmqpConnectionManager,
  ChannelWrapper
} from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { logger } from './logs/local-logger';
import {
  EnvKeyValue,
  EnvVariableScope,
  Kubernetes,
  Project,
  getOpenShiftInfoForProject,
  getOpenShiftInfoForEnvironment,
  getEnvironmentByIdWithVariables,
  getOrganizationById,
} from './api';
import { InternalEnvVariableScope } from './types';
// @ts-ignore
import sha1 from 'sha1';

import { encodeJSONBase64, toNumber } from './util/func';
import { getConfigFromEnv } from './util/config';
import { hasEnvVar, getEnvVarValue } from './util/lagoon';

interface MessageConsumer {
  (msg: ConsumeMessage): Promise<void>;
}

interface RetryHandler {
  (
    msg: ConsumeMessage,
    error: Error,
    retryCount: number,
    retryExpirationSecs: number
  ): void;
}

interface DeathHandler {
  (msg: ConsumeMessage, error: Error): void;
}

export let sendToLagoonTasks = function(
  task: string,
  payload?: any
) {
  // TODO: Actually do something here?
  return payload && undefined;
};

export let sendToLagoonTasksMonitor = function sendToLagoonTasksMonitor(
  task: string,
  payload?: any
) {
  // TODO: Actually do something here?
  return payload && undefined;
};

export let sendToLagoonActions = function(
  task: string,
  payload?: any
) {
  // TODO: Actually do something here?
  return payload && undefined;
};

export let connection: AmqpConnectionManager;
const rabbitmqHost = getConfigFromEnv('RABBITMQ_HOST', 'broker');
const rabbitmqUsername = getConfigFromEnv('RABBITMQ_USERNAME', 'guest');
const rabbitmqPassword = getConfigFromEnv('RABBITMQ_PASSWORD', 'guest');

const taskPrefetch = toNumber(getConfigFromEnv('TASK_PREFETCH_COUNT', '2'));
const taskMonitorPrefetch = toNumber(getConfigFromEnv('TASKMONITOR_PREFETCH_COUNT', '1'));

// these are required for the builddeploydata creation
// they match what are used in the kubernetesbuilddeploy service
// @TODO: INFO
// some of these variables will need to be added to webhooks2tasks in the event that overwriting is required
// deploys received by that webhooks2tasks will use functions exported by tasks, where previously they would be passed to a seperate service
// this is because there is no single service handling deploy tasks when the controller is used
// currently the services that may need to use these variables are:
//    * `api`
//    * `webhooks2tasks`
const CI = getConfigFromEnv('CI', 'false');
const overwriteActiveStandbyTaskImage = process.env.OVERWRITE_ACTIVESTANDBY_TASK_IMAGE

// add the lagoon actions queue publisher functions
export const initSendToLagoonActions = function() {
  connection = connect(
    [`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`],
    // @ts-ignore
    { json: true }
  );

  connection.on('connect', ({ url }) =>
    logger.verbose('lagoon-actions: Connected to %s', url, {
      action: 'connected',
      url
    })
  );
  connection.on('disconnect', params =>
    // @ts-ignore
    logger.error('lagoon-actions: Not connected, error: %s', params.err.code, {
      action: 'disconnected',
      reason: params
    })
  );

  const channelWrapperTasks: ChannelWrapper = connection.createChannel({
    setup(channel: ConfirmChannel) {
      return Promise.all([
        // Our main Exchange for all lagoon-actions
        channel.assertExchange('lagoon-actions', 'direct', { durable: true }),

        channel.assertExchange('lagoon-actions-delay', 'x-delayed-message', {
          durable: true,
          arguments: { 'x-delayed-type': 'fanout' }
        }),
        channel.bindExchange('lagoon-actions', 'lagoon-actions-delay', ''),
      ]);
    }
  });

  sendToLagoonActions = async (
    task: string,
    payload: any
  ): Promise<string> => {
    try {
      const buffer = Buffer.from(JSON.stringify(payload));
      await channelWrapperTasks.publish('lagoon-actions', '', buffer, {
        persistent: true,
        appId: task
      });
      logger.debug(
        `lagoon-actions: Successfully created action '${task}'`,
        payload
      );
      return `lagoon-actions: Successfully created action '${task}': ${JSON.stringify(
        payload
      )}`;
    } catch (error) {
      logger.error('lagoon-actions: Error send to lagoon-actions exchange', {
        payload,
        error
      });
      throw error;
    }
  };
}

export const initSendToLagoonTasks = function() {
  connection = connect(
    [`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`],
    // @ts-ignore
    { json: true }
  );

  connection.on('connect', ({ url }) =>
    logger.verbose('lagoon-tasks: Connected to %s', url, {
      action: 'connected',
      url
    })
  );
  connection.on('disconnect', params =>
    // @ts-ignore
    logger.error('lagoon-tasks: Not connected, error: %s', params.err.code, {
      action: 'disconnected',
      reason: params
    })
  );

  const channelWrapperTasks: ChannelWrapper = connection.createChannel({
    setup(channel: ConfirmChannel) {
      return Promise.all([
        // Our main Exchange for all lagoon-tasks
        channel.assertExchange('lagoon-tasks', 'direct', { durable: true }),

        channel.assertExchange('lagoon-tasks-delay', 'x-delayed-message', {
          durable: true,
          arguments: { 'x-delayed-type': 'fanout' }
        }),
        channel.bindExchange('lagoon-tasks', 'lagoon-tasks-delay', ''),

        // Exchange for task monitoring
        channel.assertExchange('lagoon-tasks-monitor', 'direct', {
          durable: true
        }),

        channel.assertExchange(
          'lagoon-tasks-monitor-delay',
          'x-delayed-message',
          { durable: true, arguments: { 'x-delayed-type': 'fanout' } }
        ),
        channel.bindExchange(
          'lagoon-tasks-monitor',
          'lagoon-tasks-monitor-delay',
          ''
        )
      ]);
    }
  });

  sendToLagoonTasks = async (
    task: string,
    payload: any
  ): Promise<string> => {
    try {
      const buffer = Buffer.from(JSON.stringify(payload));
      await channelWrapperTasks.publish('lagoon-tasks', task, buffer, {
        persistent: true
      });
      logger.debug(
        `lagoon-tasks: Successfully created task '${task}'`,
        payload
      );
      return `lagoon-tasks: Successfully created task '${task}': ${JSON.stringify(
        payload
      )}`;
    } catch (error) {
      logger.error('lagoon-tasks: Error send to lagoon-tasks exchange', {
        payload,
        error
      });
      throw error;
    }
  };

  sendToLagoonTasksMonitor = async (
    task: string,
    payload: any
  ): Promise<string> => {
    try {
      const buffer = Buffer.from(JSON.stringify(payload));
      await channelWrapperTasks.publish('lagoon-tasks-monitor', task, buffer, {
        persistent: true
      });
      logger.debug(
        `lagoon-tasks-monitor: Successfully created monitor '${task}'`,
        payload
      );
      return `lagoon-tasks-monitor: Successfully created task monitor '${task}': ${JSON.stringify(
        payload
      )}`;
    } catch (error) {
      logger.error(
        'lagoon-tasks-monitor: Error send to lagoon-tasks-monitor exchange',
        {
          payload,
          error
        }
      );
      throw error;
    }
  };
}

export const createTaskMonitor = async function(task: string, payload: any) {
  return sendToLagoonTasksMonitor(task, payload);
}

// makes strings "safe" if it is to be used in something dns related
export const makeSafe = (string: string): string =>
  string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')

// function to truncate the environment name as required to fit within kubernetes namespace limits
export const truncateEnvironmentName = (projectName: string, environmentName: string): string => {
  var envName = makeSafe(environmentName)
  var overlength = 58 - projectName.length;
  if ( envName.length > overlength ) {
    var hash = sha1(envName).substring(0,4)
    envName = envName.substring(0, overlength-5)
    envName = envName.concat('-' + hash)
  }
  return envName;
}

// function to seed the initial namespace for use in
export const seedNamespace = (projectName: string, environmentName: string): string => {
  var envName = truncateEnvironmentName(projectName, environmentName)
  return makeSafe(`${projectName}-${envName}`)
}

enum bulkType {
  Task,
  Deploy
}

export const getEnvironmentsRouterPatternAndVariables = async function(
  project: Pick<
    Project,
    'routerPattern' | 'sharedBaasBucket' | 'organization'
  > & {
    openshift: Pick<Kubernetes, 'routerPattern'>;
    envVariables: Pick<EnvKeyValue, 'name' | 'value' | 'scope'>[];
  },
  environment: { envVariables: Pick<EnvKeyValue, 'name' | 'value' | 'scope'>[]},
  deployTarget: Pick<Kubernetes, 'name' | 'routerPattern' | 'sharedBaasBucketName'>,
  bulkId: string | null,
  bulkName: string | null,
  buildPriority: number,
  buildVariables: Array<{name: string, value: string}>,
  bulkTask: bulkType
): Promise<{ routerPattern: string, appliedEnvVars: string }> {
  type EnvKeyValueInternal = Pick<EnvKeyValue, 'name' | 'value'> & {
    scope: EnvVariableScope | InternalEnvVariableScope;
  }

  // Single list of env vars that apply to an environment. Env vars from multiple
  // sources (organization, project, enviornment, build vars, etc) are
  // consolidated based on precedence.
  let appliedEnvVars: EnvKeyValueInternal[] = [];

  // Appends newVar to appliedEnvVars only if newVar is unique by name.
  const applyIfNotExists = (newVar: EnvKeyValueInternal): void => {
    const index = appliedEnvVars.findIndex((searchVar) => searchVar.name === newVar.name)

    if (index === -1) {
      appliedEnvVars.push(newVar)
    }
  }

  // Get the router pattern from the project or deploy target.
  let routerPattern = project.openshift.routerPattern
  // deployTarget.routerPattern allows null.
  if (typeof deployTarget.routerPattern !== 'undefined') {
    routerPattern = deployTarget.routerPattern
  }
  // project.routerPattern does now allow null.
  if (project.routerPattern) {
    routerPattern = project.routerPattern
  }

  // Load organization if project is in one.
  let org;
  if (project.organization) {
    org = await getOrganizationById(project.organization);
  }

  /*
   * Internal scoped env vars.
   *
   * Uses the env vars system to send data to lagoon-remote but should not be
   * overrideable by Lagoon API env vars.
   */

  applyIfNotExists({
    name: "LAGOON_SYSTEM_CORE_VERSION",
    value: getConfigFromEnv('LAGOON_VERSION', 'unknown'),
    scope: InternalEnvVariableScope.INTERNAL_SYSTEM
  });

  applyIfNotExists({
    name: 'LAGOON_SYSTEM_ROUTER_PATTERN',
    value: routerPattern,
    scope: InternalEnvVariableScope.INTERNAL_SYSTEM
  });

  const [bucketName, isSharedBucket] = await getBaasBucketName(project, deployTarget)
  if (isSharedBucket) {
    applyIfNotExists({
      name: "LAGOON_SYSTEM_PROJECT_SHARED_BUCKET",
      value: bucketName,
      scope: InternalEnvVariableScope.INTERNAL_SYSTEM
    });
  }

  if (org) {
    applyIfNotExists({
      name: "LAGOON_ROUTE_QUOTA",
      value: `${org.quotaRoute}`,
      scope: InternalEnvVariableScope.INTERNAL_SYSTEM
    });
  }

  /*
   * Normally scoped env vars.
   *
   * Env vars that are set by users, or derived from them.
   */

  // Build env vars passed to the API.
  for (const buildVar of buildVariables) {
    applyIfNotExists({
      name: buildVar.name,
      value: buildVar.value,
      scope: EnvVariableScope.BUILD
    })
  }

  // Bulk deployment env vars.
  if (bulkTask === bulkType.Deploy) {
    applyIfNotExists({
      name: "LAGOON_BUILD_PRIORITY",
      value: buildPriority.toString(),
      scope: EnvVariableScope.BUILD
    });

    if (bulkId) {
      applyIfNotExists({
        name: "LAGOON_BULK_DEPLOY",
        value: "true",
        scope: EnvVariableScope.BUILD
      });
      applyIfNotExists({
        name: "LAGOON_BULK_DEPLOY_ID",
        value: bulkId,
        scope: EnvVariableScope.BUILD
      });

      if (bulkName) {
        applyIfNotExists({
          name: "LAGOON_BULK_DEPLOY_NAME",
          value: bulkName,
          scope: EnvVariableScope.BUILD
        });
      }
    }
  } else if (bulkTask === bulkType.Task) {
    applyIfNotExists({
      name: "LAGOON_TASK_PRIORITY",
      value: buildPriority.toString(),
      scope: EnvVariableScope.BUILD
    })

    if (bulkId) {
      applyIfNotExists({
        name: "LAGOON_BULK_TASK",
        value: "true",
        scope: EnvVariableScope.BUILD
      });
      applyIfNotExists({
        name: "LAGOON_BULK_TASK_ID",
        value: bulkId,
        scope: EnvVariableScope.BUILD
      });

      if (bulkName) {
        applyIfNotExists({
          name: "LAGOON_BULK_TASK_NAME",
          value: bulkName,
          scope: EnvVariableScope.BUILD
        });
      }
    }
  }

  // Environment env vars.
  for (const envVar of environment.envVariables) {
    applyIfNotExists(envVar)
  }

  // Project env vars.
  for (const projVar of project.envVariables) {
    applyIfNotExists(projVar)
  }

  if (org) {
    // Organization env vars.
    for (const orgVar of org.envVariables) {
      applyIfNotExists(orgVar)
    }
  }

  return { routerPattern, appliedEnvVars: encodeJSONBase64(appliedEnvVars) }
}

// creates the restore job configuration for use in the misc task
const restoreConfig = (name: string, backupId: string, backupS3Config: any, restoreS3Config: any) => {
  let config = {
    metadata: {
      name
    },
    spec: {
      snapshot: backupId,
      restoreMethod: {
        s3: restoreS3Config ? restoreS3Config : {},
      },
      backend: {
        s3: backupS3Config,
        repoPasswordSecretRef: {
          key: 'repo-pw',
          name: 'baas-repo-pw'
        },
      },
    },
  };

  return config;
};

export const getTaskProjectEnvironmentVariables = async (projectName: string, environmentId: number): Promise<string> => {
  // inject variables into tasks the same way it is in builds
  // this makes variables available to tasks the same way for consumption
  // this will make it possible to handle variable updates in the future without
  // needing to trigger a full deployment
  const result = await getOpenShiftInfoForProject(projectName);
  const environment = await getEnvironmentByIdWithVariables(environmentId);

  let priority = result.project.developmentBuildPriority || 5
  if (environment.environmentById.environmentType == 'production') {
    priority = result.project.productionBuildPriority || 6
  }

  const { appliedEnvVars } = await getEnvironmentsRouterPatternAndVariables(
    result.project,
    environment.environmentById,
    environment.environmentById.openshift,
    null, null, priority, [], bulkType.Task // bulk deployments don't apply to tasks yet, but this is future proofing the function call
  )
  return appliedEnvVars
}

export const getBaasBucketName = async (
  project: Pick<Project, 'sharedBaasBucket'> & {
    envVariables: Pick<EnvKeyValue, 'name' | 'value'>[];
  },
  deploytarget: Pick<Kubernetes, 'sharedBaasBucketName' | 'name'>
): Promise<[string | undefined, false] | [string, true]> => {

  // Bucket name defined in API env var always takes precedence.
  const envVarBucketName = getEnvVarValue(project.envVariables, 'LAGOON_BAAS_BUCKET_NAME');
  if (envVarBucketName) {
    return [envVarBucketName, false];
  }

  if (project.sharedBaasBucket) {
    const sharedBaasBucketName = deploytarget.sharedBaasBucketName ?? makeSafe(deploytarget.name);

    return [sharedBaasBucketName, true];
  }

  return [undefined, false];
}

export const createTaskTask = async function(taskData: any) {
  const { project } = taskData;

  // inject variables into tasks the same way it is in builds
  const envVars = await getTaskProjectEnvironmentVariables(
    project.name,
    taskData.environment.id
  )
  taskData.project.variables = {
    environment: envVars,
  }

  if (project.organization != null) {
    const curOrg = await getOrganizationById(project.organization);
    const organization = {
      name: curOrg.name,
      id: curOrg.id,
    }
    taskData.project.organization = organization
  }

  // since controllers queues are named, we have to send it to the right tasks queue
  // do that here by querying which deploytarget the environment uses
  const result = await getOpenShiftInfoForEnvironment(taskData.environment.id);
  const deployTarget = result.environment.openshift.name
  return sendToLagoonTasks(deployTarget+":jobs", taskData);
}

export const createMiscTask = async function(taskData: any) {
  const {
    key,
    data: { project }
  } = taskData;

  // handle any controller based misc tasks
  let updatedKey = `deploytarget:${key}`;
  let taskId = 'misc-kubernetes';
  // determine the deploy target (openshift/kubernetes) for the task to go to
  // we get this from the environment
  const result = await getOpenShiftInfoForEnvironment(taskData.data.environment.id);
  const deployTarget = result.environment.openshift.name
  // this is the json structure for sending a misc task to the controller
  // there are some additional bits that can be adjusted, and these are done in the switch below on `updatedKey`
  var miscTaskData: any = {
    misc: {},
    key: updatedKey,
    environment: {
      name: taskData.data.environment.name,
      openshiftProjectName: taskData.data.environment.openshiftProjectName
    },
    project: {
      name: taskData.data.project.name
    },
    task: taskData.data.task,
    advancedTask: {}
  }
  switch (updatedKey) {
    case 'deploytarget:restic:backup:restore':
      // Handle setting up the configuration for a restic restoration task
      const randRestoreId = Math.random().toString(36).substring(7);
      const restoreName = `restore-${R.slice(0, 7, taskData.data.backup.backupId)}-${randRestoreId}`;

      // Handle custom backup configurations
      let backupS3Config = {}
      if (
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_ENDPOINT') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_BUCKET') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_ACCESS_KEY') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_SECRET_KEY')
      ) {
        backupS3Config = {
          endpoint: getEnvVarValue(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_ENDPOINT'),
          bucket: getEnvVarValue(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_BUCKET'),
          accessKeyIDSecretRef: {
            name: "lagoon-baas-custom-backup-credentials",
            key: "access-key"
          },
          secretAccessKeySecretRef: {
            name: "lagoon-baas-custom-backup-credentials",
            key: "secret-key"
          }
        }
      } else {
        // Parse out the baasBucketName for any migrated projects
        // check if the project is configured for a shared baas bucket
        let [bucketName, isSharedBucket] = await getBaasBucketName(result.environment.project, result.environment.openshift)
        if (isSharedBucket) {
          // if it is a shared bucket, add the repo key to it too for restores
          bucketName = `${bucketName}/baas-${makeSafe(taskData.data.project.name)}`
        }
        backupS3Config = {
          bucket: bucketName ?? `baas-${makeSafe(taskData.data.project.name)}`
        }
      }

      // Handle custom restore configurations
      let restoreS3Config = {}
      if (
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_ENDPOINT') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_BUCKET') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_ACCESS_KEY') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_SECRET_KEY')
      ) {
        restoreS3Config = {
          endpoint: getEnvVarValue(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_ENDPOINT'),
          bucket: getEnvVarValue(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_BUCKET'),
          accessKeyIDSecretRef: {
            name: "lagoon-baas-custom-restore-credentials",
            key: "access-key"
          },
          secretAccessKeySecretRef: {
            name: "lagoon-baas-custom-restore-credentials",
            key: "secret-key"
          }
        }
      }

      // generate the restore CRD
      const restoreConf = restoreConfig(restoreName, taskData.data.backup.backupId, backupS3Config, restoreS3Config)
      //logger.info(restoreConf)
      miscTaskData.misc.miscResource = encodeJSONBase64(restoreConf)
      break;
    case 'deploytarget:task:activestandby':
      // handle setting up the task configuration for running the active/standby switch
      // this uses the `advanced task` system in the controllers
      // generate out custom json payload to send to the advanced task
      var jsonPayload: any = {
        productionEnvironment: taskData.data.productionEnvironment.name,
        standbyEnvironment: taskData.data.environment.name,
        sourceNamespace: makeSafe(taskData.data.environment.openshiftProjectName),
        destinationNamespace: makeSafe(taskData.data.productionEnvironment.openshiftProjectName)
      }
      // set the task data up
      miscTaskData.advancedTask.JSONPayload = encodeJSONBase64(jsonPayload);
      // use this image to run the task
      let taskImage = ""
      // choose which task image to use
      if (CI == "true") {
        taskImage = "172.17.0.1:5000/lagoon/task-activestandby:latest"
      } else if (overwriteActiveStandbyTaskImage) {
        // allow to overwrite the image we use via OVERWRITE_ACTIVESTANDBY_TASK_IMAGE env variable
        taskImage = overwriteActiveStandbyTaskImage
      } else {
        taskImage = `uselagoon/task-activestandby:${getConfigFromEnv('LAGOON_VERSION', 'unknown')}`
      }
      miscTaskData.advancedTask.runnerImage = taskImage
      // miscTaskData.advancedTask.runnerImage = "shreddedbacon/runner:latest"
      break;
    case 'deploytarget:task:advanced':
      // inject variables into advanced tasks the same way it is in builds and standard tasks
      const envVars = await getTaskProjectEnvironmentVariables(
        taskData.data.project.name,
        taskData.data.environment.id
      )
      miscTaskData.project.variables = {
        environment: envVars,
      }
      miscTaskData.advancedTask = taskData.data.advancedTask
      break;
    case 'deploytarget:task:cancel':
      // task cancellation is just a standard unmodified message
      miscTaskData.misc = taskData.data.task
      break;
    case 'deploytarget:build:cancel':
      // build cancellation is just a standard unmodified message
      miscTaskData.misc = taskData.data.build
      break;
    default:
      miscTaskData.misc = taskData.data.build
      break;
  }
  // send the task to the queue
  if (project.organization != null) {
    const curOrg = await getOrganizationById(project.organization);
    const organization = {
      name: curOrg.name,
      id: curOrg.id,
    }
    miscTaskData.project.organization = organization
  }
  return sendToLagoonTasks(deployTarget+':misc', miscTaskData);
}

export const consumeTasks = async function(
  taskQueueName: string,
  messageConsumer: MessageConsumer,
  retryHandler: RetryHandler,
  deathHandler: DeathHandler
) {
  const onMessage = async (msg: ConsumeMessage) => {
    try {
      await messageConsumer(msg);
      channelWrapperTasks.ack(msg);
    } catch (error) {
      // We land here if the messageConsumer has an error that it did not itslef handle.
      // This is how the consumer informs us that we it would like to retry the message in a couple of seconds

      const headers = msg.properties.headers || {'x-retry': 1}
      const retryCount = headers['x-retry']
        ? headers['x-retry'] + 1
        : 1;

      if (retryCount > 3) {
        channelWrapperTasks.ack(msg);
        deathHandler(msg, error);
        return;
      }

      const retryDelaySecs = 10 ** retryCount;
      const retryDelayMilisecs = retryDelaySecs * 1000;

      try {
        retryHandler(msg, error, retryCount, retryDelaySecs);
      } catch (retryError) {
        // intentionally empty as we don't want to fail and not requeue our message just becase the retryHandler fails
        logger.info(
          `lagoon-tasks: retryHandler for ${taskQueueName} failed with ${retryError}, will continue to retry the message anyway.`
        );
      }

      // copying options from the original message
      const retryMsgOptions = {
        appId: msg.properties.appId,
        timestamp: msg.properties.timestamp,
        contentType: msg.properties.contentType,
        deliveryMode: msg.properties.deliveryMode,
        headers: {
          ...msg.properties.headers,
          'x-delay': retryDelayMilisecs,
          'x-retry': retryCount
        },
        persistent: true
      };

      // publishing a new message with the same content as the original message but into the `lagoon-tasks-delay` exchange,
      // which will send the message into the original exchange `lagoon-tasks` after waiting the x-delay time.
      channelWrapperTasks.publish(
        'lagoon-tasks-delay',
        msg.fields.routingKey,
        msg.content,
        retryMsgOptions
      );

      // acknologing the existing message, we cloned it and is not necessary anymore
      channelWrapperTasks.ack(msg);
    }
  };

  const channelWrapperTasks = connection.createChannel({
    setup(channel: ConfirmChannel) {
      return Promise.all([
        channel.assertQueue(`lagoon-tasks:${taskQueueName}`, { durable: true }),
        channel.bindQueue(
          `lagoon-tasks:${taskQueueName}`,
          'lagoon-tasks',
          taskQueueName
        ),
        channel.prefetch(taskPrefetch),
        channel.consume(`lagoon-tasks:${taskQueueName}`, onMessage, {
          noAck: false
        })
      ]);
    }
  });
}

export const consumeTaskMonitor = async function(
  taskMonitorQueueName: string,
  messageConsumer: MessageConsumer,
  deathHandler: DeathHandler
) {
  const onMessage = async (msg: ConsumeMessage) => {
    try {
      await messageConsumer(msg);
      channelWrapperTaskMonitor.ack(msg);
    } catch (error) {
      // We land here if the messageConsumer has an error that it did not itslef handle.
      // This is how the consumer informs us that we it would like to retry the message in a couple of seconds

      const headers = msg.properties.headers || {'x-retry': 1}
      const retryCount = headers['x-retry']
        ? headers['x-retry'] + 1
        : 1;

      if (retryCount > 750) {
        channelWrapperTaskMonitor.ack(msg);
        deathHandler(msg, error);
        return;
      }

      let retryDelaySecs = 5;

      if (error.delayFn) {
        retryDelaySecs = error.delayFn(retryCount);
      }

      const retryDelayMilisecs = retryDelaySecs * 1000;

      // copying options from the original message
      const retryMsgOptions = {
        appId: msg.properties.appId,
        timestamp: msg.properties.timestamp,
        contentType: msg.properties.contentType,
        deliveryMode: msg.properties.deliveryMode,
        headers: {
          ...msg.properties.headers,
          'x-delay': retryDelayMilisecs,
          'x-retry': retryCount
        },
        persistent: true
      };

      // publishing a new message with the same content as the original message but into the `lagoon-tasks-delay` exchange,
      // which will send the message into the original exchange `lagoon-tasks` after waiting the x-delay time.
      channelWrapperTaskMonitor.publish(
        'lagoon-tasks-monitor-delay',
        msg.fields.routingKey,
        msg.content,
        retryMsgOptions
      );

      // acknologing the existing message, we cloned it and is not necessary anymore
      channelWrapperTaskMonitor.ack(msg);
    }
  };

  const channelWrapperTaskMonitor = connection.createChannel({
    setup(channel: ConfirmChannel) {
      return Promise.all([
        channel.assertQueue(`lagoon-tasks-monitor:${taskMonitorQueueName}`, {
          durable: true
        }),
        channel.bindQueue(
          `lagoon-tasks-monitor:${taskMonitorQueueName}`,
          'lagoon-tasks-monitor',
          taskMonitorQueueName
        ),
        channel.prefetch(taskMonitorPrefetch),
        channel.consume(
          `lagoon-tasks-monitor:${taskMonitorQueueName}`,
          onMessage,
          { noAck: false }
        )
      ]);
    }
  });
}

  // leverages the `misc` queue to handle retention policy only messages to controller
  // this is essentially a clone of createMiscTask, but specifically for retention policies
export const createRetentionPolicyTask = async function(policyData: any) {
  var policyPayload: any = {
    key: `deploytarget:${policyData.key}`,
    misc: {}
  }
  switch (`deploytarget:${policyData.key}`) {
    case 'deploytarget:harborpolicy:update':
      // remote-controller has a basic payload resource under `misc` called `miscResource` which can store bytes
      // so this b64 encodes the payload event and inserts it into the miscResource so that the remote-controller will understand it
      const payloadBytes = new Buffer(JSON.stringify(policyData.data.event).replace(/\\n/g, "\n")).toString('base64')
      policyPayload.misc.miscResource = payloadBytes
      break;
    default:
      break;
  }
  return sendToLagoonTasks(policyData.data.target+':misc', policyPayload);
}
