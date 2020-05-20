import {
  connect,
  AmqpConnectionManager,
  ChannelWrapper
} from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { logger } from './local-logging';
import { getActiveSystemForProject, getEnvironmentsForProject } from './api';

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

// TODO: This is weird, why do we need an empty default connection? Or is there
// a better way to type this?
const defaultConnection: AmqpConnectionManager = {
  // Default function for Event
  removeListener: (() => {}) as any,
  off: (() => {}) as any,
  removeAllListeners: (() => {}) as any,
  setMaxListeners: (() => {}) as any,
  getMaxListeners: (() => {}) as any,
  listeners: (() => {}) as any,
  rawListeners: (() => {}) as any,
  emit: (() => {}) as any,
  eventNames: (() => {}) as any,
  listenerCount: (() => {}) as any,

  // Default functions for AmqpConnectionManager
  addListener: (() => {}) as any,
  on: (() => {}) as any,
  once: (() => {}) as any,
  prependListener: (() => {}) as any,
  prependOnceListener: (() => {}) as any,
  createChannel: (() => {}) as any,
  isConnected: (() => {}) as any,
  close: (() => {}) as any
};

export let connection: AmqpConnectionManager = defaultConnection;
const rabbitmqHost = process.env.RABBITMQ_HOST || 'broker';
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || 'guest';
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || 'guest';

class UnknownActiveSystem extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnknownActiveSystem';
  }
}

class NoNeedToDeployBranch extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoNeedToDeployBranch';
  }
}

class NoNeedToRemoveBranch extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoNeedToRemoveBranch';
  }
}

class CannotDeleteProductionEnvironment extends Error {
  constructor(message) {
    super(message);
    this.name = 'CannotDeleteProductionEnvironment';
  }
}

class EnvironmentLimit extends Error {
  constructor(message) {
    super(message);
    this.name = 'EnvironmentLimit';
  }
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

export const createDeployTask = async function(deployData: any) {
  const {
    projectName,
    branchName,
    // sha,
    type,
    pullrequestTitle
  } = deployData;

  const project = await getActiveSystemForProject(projectName, 'Deploy');
  const environments = await getEnvironmentsForProject(projectName);

  // environments =
  //  { project:
  //     { environment_deployments_limit: 1,
  //       production_environment: 'master',
  //       environments: [ { name: 'develop', environment_type: 'development' }, [Object] ] } }

  if (typeof project.activeSystemsDeploy === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for tasks 'deploy' in for project ${projectName}`
    );
  }

  switch (project.activeSystemsDeploy) {
    case 'lagoon_openshiftBuildDeploy':
    case 'lagoon_kubernetesBuildDeploy':
      // we want to limit production environments, without making it configurable currently
      var productionEnvironmentsLimit = 2;

      // we want to make sure we can deploy the `production` env, and also the env defined as standby
      if (
        environments.project.productionEnvironment === branchName ||
        environments.project.standbyProductionEnvironment === branchName
      ) {
        // get a list of production environments
        const prod_environments = environments.project.environments
          .filter(e => e.environmentType === 'production')
          .map(e => e.name);
        logger.debug(
          `projectName: ${projectName}, branchName: ${branchName}, existing environments are `,
          prod_environments
        );

        if (prod_environments.length >= productionEnvironmentsLimit) {
          if (prod_environments.find(i => i === branchName)) {
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, environment already exists, no environment limits considered`
            );
          } else {
            throw new EnvironmentLimit(
              `'${branchName}' would exceed the configured limit of ${productionEnvironmentsLimit} production environments for project ${projectName}`
            );
          }
        }
      } else {
        // get a list of non-production environments
        const dev_environments = environments.project.environments
          .filter(e => e.environmentType === 'development')
          .map(e => e.name);
        logger.debug(
          `projectName: ${projectName}, branchName: ${branchName}, existing environments are `,
          dev_environments
        );

        if (
          environments.project.developmentEnvironmentsLimit !== null &&
          dev_environments.length >=
            environments.project.developmentEnvironmentsLimit
        ) {
          if (dev_environments.find(i => i === branchName)) {
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, environment already exists, no environment limits considered`
            );
          } else {
            throw new EnvironmentLimit(
              `'${branchName}' would exceed the configured limit of ${environments.project.developmentEnvironmentsLimit} development environments for project ${projectName}`
            );
          }
        }
      }

      if (type === 'branch') {
        switch (project.branches) {
          case undefined:
          case null:
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, no branches defined in active system, assuming we want all of them`
            );
            switch (project.activeSystemsDeploy) {
              case 'lagoon_openshiftBuildDeploy':
                return sendToLagoonTasks('builddeploy-openshift', deployData);
              case 'lagoon_kubernetesBuildDeploy':
                return sendToLagoonTasks('builddeploy-kubernetes', deployData);
              default:
                throw new UnknownActiveSystem(
                  `Unknown active system '${project.activeSystemsDeploy}' for task 'deploy' in for project ${projectName}`
                );
            }
          case 'true':
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, all branches active, therefore deploying`
            );
            switch (project.activeSystemsDeploy) {
              case 'lagoon_openshiftBuildDeploy':
                return sendToLagoonTasks('builddeploy-openshift', deployData);
              case 'lagoon_kubernetesBuildDeploy':
                return sendToLagoonTasks('builddeploy-kubernetes', deployData);
              default:
                throw new UnknownActiveSystem(
                  `Unknown active system '${project.activeSystemsDeploy}' for task 'deploy' in for project ${projectName}`
                );
            }
          case 'false':
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, branch deployments disabled`
            );
            throw new NoNeedToDeployBranch('Branch deployments disabled');
          default: {
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, regex ${project.branches}, testing if it matches`
            );
            const branchRegex = new RegExp(project.branches);
            if (branchRegex.test(branchName)) {
              logger.debug(
                `projectName: ${projectName}, branchName: ${branchName}, regex ${project.branches} matched branchname, starting deploy`
              );
              switch (project.activeSystemsDeploy) {
                case 'lagoon_openshiftBuildDeploy':
                  return sendToLagoonTasks('builddeploy-openshift', deployData);
                case 'lagoon_kubernetesBuildDeploy':
                  return sendToLagoonTasks(
                    'builddeploy-kubernetes',
                    deployData
                  );
                default:
                  throw new UnknownActiveSystem(
                    `Unknown active system '${project.activeSystemsDeploy}' for task 'deploy' in for project ${projectName}`
                  );
              }
            }
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, regex ${project.branches} did not match branchname, not deploying`
            );
            throw new NoNeedToDeployBranch(
              `configured regex '${project.branches}' does not match branchname '${branchName}'`
            );
          }
        }
      } else if (type === 'pullrequest') {
        switch (project.pullrequests) {
          case undefined:
          case null:
            logger.debug(
              `projectName: ${projectName}, pullrequest: ${branchName}, no pullrequest defined in active system, assuming we want all of them`
            );
            switch (project.activeSystemsDeploy) {
              case 'lagoon_openshiftBuildDeploy':
                return sendToLagoonTasks('builddeploy-openshift', deployData);
              case 'lagoon_kubernetesBuildDeploy':
                return sendToLagoonTasks('builddeploy-kubernetes', deployData);
              default:
                throw new UnknownActiveSystem(
                  `Unknown active system '${
                    project.activeSystemsDeploy
                  }' for task 'deploy' in for project ${projectName}`,
                );
            }
          case 'true':
            logger.debug(
              `projectName: ${projectName}, pullrequest: ${branchName}, all pullrequest active, therefore deploying`
            );
            switch (project.activeSystemsDeploy) {
              case 'lagoon_openshiftBuildDeploy':
                return sendToLagoonTasks('builddeploy-openshift', deployData);
              case 'lagoon_kubernetesBuildDeploy':
                return sendToLagoonTasks('builddeploy-kubernetes', deployData);
              default:
                throw new UnknownActiveSystem(
                  `Unknown active system '${
                    project.activeSystemsDeploy
                  }' for task 'deploy' in for project ${projectName}`,
                );
            }
          case 'false':
            logger.debug(
              `projectName: ${projectName}, pullrequest: ${branchName}, pullrequest deployments disabled`
            );
            throw new NoNeedToDeployBranch('PullRequest deployments disabled');
          default: {
            logger.debug(
              `projectName: ${projectName}, pullrequest: ${branchName}, regex ${project.pullrequests}, testing if it matches PR Title '${pullrequestTitle}'`
            );

            const branchRegex = new RegExp(project.pullrequests);
            if (branchRegex.test(pullrequestTitle)) {
              logger.debug(
                `projectName: ${projectName}, pullrequest: ${branchName}, regex ${project.pullrequests} matched PR Title '${pullrequestTitle}', starting deploy`
              );
              switch (project.activeSystemsDeploy) {
                case 'lagoon_openshiftBuildDeploy':
                  return sendToLagoonTasks('builddeploy-openshift', deployData);
                case 'lagoon_kubernetesBuildDeploy':
                  return sendToLagoonTasks('builddeploy-kubernetes', deployData);
                default:
                  throw new UnknownActiveSystem(
                    `Unknown active system '${
                      project.activeSystemsDeploy
                    }' for task 'deploy' in for project ${projectName}`,
                  );
              }
            }
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, regex ${project.pullrequests} did not match PR Title, not deploying`
            );
            throw new NoNeedToDeployBranch(
              `configured regex '${project.pullrequests}' does not match PR Title '${pullrequestTitle}'`
            );
          }
        }
      }
      break;
    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${project.activeSystemsDeploy}' for task 'deploy' in for project ${projectName}`
      );
  }
}

export const createPromoteTask = async function(promoteData: any) {
  const {
    projectName
    // branchName,
    // promoteSourceEnvironment,
    // type,
  } = promoteData;

  const project = await getActiveSystemForProject(projectName, 'Promote');

  if (typeof project.activeSystemsPromote === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for tasks 'deploy' in for project ${projectName}`
    );
  }

  switch (project.activeSystemsPromote) {
    case 'lagoon_openshiftBuildDeploy':
      return sendToLagoonTasks('builddeploy-openshift', promoteData);

    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${project.activeSystemsPromote}' for task 'deploy' in for project ${projectName}`
      );
  }
}

export const createRemoveTask = async function(removeData: any) {
  const {
    projectName,
    branch,
    branchName,
    pullrequestNumber,
    pullrequestTitle,
    forceDeleteProductionEnvironment,
    type
  } = removeData;

  // Load all environments that currently exist (and are not deleted).
  const allEnvironments = await getEnvironmentsForProject(projectName);

  // Check to see if we are deleting a production environment, and if so,
  // ensure the flag is set to allow this.
  if (
    branch === allEnvironments.project.productionEnvironment ||
    (allEnvironments.project.standbyProductionEnvironment &&
      branch === allEnvironments.project.standbyProductionEnvironment)
  ) {
    if (forceDeleteProductionEnvironment !== true) {
      throw new CannotDeleteProductionEnvironment(
        `'${branch}' is defined as the production environment for ${projectName}, refusing to remove.`
      );
    }
  }

  const project = await getActiveSystemForProject(projectName, 'Remove');

  if (typeof project.activeSystemsRemove === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for tasks 'remove' in for project ${projectName}`
    );
  }

  switch (project.activeSystemsRemove) {
    case 'lagoon_openshiftRemove':
      if (type === 'branch') {
        // Check to ensure the environment actually exists.
        let foundEnvironment = false;
        allEnvironments.project.environments.forEach(function(
          environment,
          index
        ) {
          if (environment.name === branch) {
            foundEnvironment = true;
          }
        });

        if (!foundEnvironment) {
          logger.debug(
            `projectName: ${projectName}, branchName: ${branch}, no environment found.`
          );
          throw new NoNeedToRemoveBranch(
            'Branch environment does not exist, no need to remove anything.'
          );
        }

        logger.debug(
          `projectName: ${projectName}, branchName: ${branchName}. Removing branch environment.`
        );
        return sendToLagoonTasks('remove-openshift', removeData);
      } else if (type === 'pullrequest') {
        // Work out the branch name from the PR number.
        let branchName = 'pr-' + pullrequestNumber;
        removeData.branchName = 'pr-' + pullrequestNumber;

        // Check to ensure the environment actually exists.
        let foundEnvironment = false;
        allEnvironments.project.environments.forEach(function(
          environment,
          index
        ) {
          if (environment.name === branchName) {
            foundEnvironment = true;
          }
        });

        if (!foundEnvironment) {
          logger.debug(
            `projectName: ${projectName}, pullrequest: ${branchName}, no pullrequest found.`
          );
          throw new NoNeedToRemoveBranch(
            'Pull Request environment does not exist, no need to remove anything.'
          );
        }

        logger.debug(
          `projectName: ${projectName}, pullrequest: ${branchName}. Removing pullrequest environment.`
        );
        return sendToLagoonTasks('remove-openshift', removeData);
      } else if (type === 'promote') {
        return sendToLagoonTasks('remove-openshift', removeData);
      }
      break;

    case 'lagoon_kubernetesRemove':
      if (type === 'branch') {
        // Check to ensure the environment actually exists.
        let foundEnvironment = false;
        allEnvironments.project.environments.forEach(function(
          environment,
          index
        ) {
          if (environment.name === branch) {
            foundEnvironment = true;
          }
        });

        if (!foundEnvironment) {
          logger.debug(
            `projectName: ${projectName}, branchName: ${branch}, no environment found.`
          );
          throw new NoNeedToRemoveBranch(
            'Branch environment does not exist, no need to remove anything.'
          );
        }

        logger.debug(
          `projectName: ${projectName}, branchName: ${branchName}. Removing branch environment.`
        );
        return sendToLagoonTasks('remove-kubernetes', removeData);
      } else if (type === 'pullrequest') {
        // Work out the branch name from the PR number.
        let branchName = 'pr-' + pullrequestNumber;
        removeData.branchName = 'pr-' + pullrequestNumber;

        // Check to ensure the environment actually exists.
        let foundEnvironment = false;
        allEnvironments.project.environments.forEach(function(
          environment,
          index
        ) {
          if (environment.name === branchName) {
            foundEnvironment = true;
          }
        });

        if (!foundEnvironment) {
          logger.debug(
            `projectName: ${projectName}, pullrequest: ${branchName}, no pullrequest found.`
          );
          throw new NoNeedToRemoveBranch(
            'Pull Request environment does not exist, no need to remove anything.'
          );
        }

        logger.debug(
          `projectName: ${projectName}, pullrequest: ${branchName}. Removing pullrequest environment.`
        );
        return sendToLagoonTasks('remove-kubernetes', removeData);
      } else if (type === 'promote') {
        return sendToLagoonTasks('remove-kubernetes', removeData);
      }
      break;

    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${project.activeSystemsRemove}' for task 'remove' in for project ${projectName}`
      );
  }
}

export const createTaskTask = async function(taskData: any) {
  const { project } = taskData;

  const projectSystem = await getActiveSystemForProject(project.name, 'Task');

  if (typeof projectSystem.activeSystemsTask === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for 'task' for project ${project.name}`
    );
  }

  switch (projectSystem.activeSystemsTask) {
    case 'lagoon_openshiftJob':
      return sendToLagoonTasks('job-openshift', taskData);

    case 'lagoon_kubernetesJob':
      return sendToLagoonTasks('job-kubernetes', taskData);

    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${projectSystem.activeSystemsTask}' for 'task' for project ${project.name}`
      );
  }
}

export const createMiscTask = async function(taskData: any) {
  const {
    key,
    data: { project }
  } = taskData;

  const data = await getActiveSystemForProject(project.name, 'Misc');

  let updatedKey = key;
  let taskId = '';
  switch (data.activeSystemsMisc) {
    case 'lagoon_openshiftMisc':
      updatedKey = `openshift:${key}`;
      taskId = 'misc-openshift';
      break;
    case 'lagoon_kubernetesMisc':
      updatedKey = `kubernetes:${key}`;
      taskId = 'misc-kubernetes';
      break;

    default:
      break;
  }

  return sendToLagoonTasks(taskId, { ...taskData, key: updatedKey });
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

      const retryCount = msg.properties.headers['x-retry']
        ? msg.properties.headers['x-retry'] + 1
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
        channel.prefetch(2),
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

      const retryCount = msg.properties.headers['x-retry']
        ? msg.properties.headers['x-retry'] + 1
        : 1;

      if (retryCount > 750) {
        channelWrapperTaskMonitor.ack(msg);
        deathHandler(msg, error);
        return;
      }

      const retryDelayMilisecs = 5000;

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
        channel.prefetch(1),
        channel.consume(
          `lagoon-tasks-monitor:${taskMonitorQueueName}`,
          onMessage,
          { noAck: false }
        )
      ]);
    }
  });
}
