// @flow

const amqp = require('amqp-connection-manager');
const { logger } = require('./local-logging');

exports.initSendToLagoonTasks = initSendToLagoonTasks;
exports.createDeployTask = createDeployTask;
exports.createPromoteTask = createPromoteTask;
exports.createRemoveTask = createRemoveTask;
exports.createTaskTask = createTaskTask;
exports.createMiscTask = createMiscTask;
exports.createTaskMonitor = createTaskMonitor;
exports.consumeTaskMonitor = consumeTaskMonitor;
exports.consumeTasks = consumeTasks;

import type { ChannelWrapper } from './types';

const {
  getActiveSystemForProject,
  getProductionEnvironmentForProject,
  getEnvironmentsForProject,
} = require('./api');

let sendToLagoonTasks = (exports.sendToLagoonTasks = function sendToLagoonTasks(
  task: string,
  payload?: Object,
) {
  // TODO: Actually do something here?
  return payload && undefined;
});

let sendToLagoonTasksMonitor = (exports.sendToLagoonTasksMonitor = function sendToLagoonTasksMonitor(
  task: string,
  payload?: Object,
) {
  // TODO: Actually do something here?
  return payload && undefined;
});

let connection = (exports.connection = function connection() {});
const rabbitmqHost = process.env.RABBITMQ_HOST || 'broker';
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || 'guest';
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || 'guest';

class UnknownActiveSystem extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownActiveSystem';
  }
}

class NoNeedToDeployBranch extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoNeedToDeployBranch';
  }
}

class NoNeedToRemoveBranch extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoNeedToRemoveBranch';
  }
}

class CannotDeleteProductionEnvironment extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CannotDeleteProductionEnvironment';
  }
}

class EnvironmentLimit extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentLimit';
  }
}

function initSendToLagoonTasks() {
  connection = amqp.connect(
    [`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`],
    { json: true },
  );

  connection.on('connect', ({ url }) =>
    logger.verbose('lagoon-tasks: Connected to %s', url, {
      action: 'connected',
      url,
    }),
  );
  connection.on('disconnect', params =>
    logger.error('lagoon-tasks: Not connected, error: %s', params.err.code, {
      action: 'disconnected',
      reason: params,
    }),
  );

  const channelWrapperTasks: ChannelWrapper = connection.createChannel({
    setup(channel) {
      return Promise.all([
        // Our main Exchange for all lagoon-tasks
        channel.assertExchange('lagoon-tasks', 'direct', { durable: true }),

        channel.assertExchange('lagoon-tasks-delay', 'x-delayed-message', {
          durable: true,
          arguments: { 'x-delayed-type': 'fanout' },
        }),
        channel.bindExchange('lagoon-tasks', 'lagoon-tasks-delay', ''),

        // Exchange for task monitoring
        channel.assertExchange('lagoon-tasks-monitor', 'direct', {
          durable: true,
        }),

        channel.assertExchange(
          'lagoon-tasks-monitor-delay',
          'x-delayed-message',
          { durable: true, arguments: { 'x-delayed-type': 'fanout' } },
        ),
        channel.bindExchange(
          'lagoon-tasks-monitor',
          'lagoon-tasks-monitor-delay',
          '',
        ),
      ]);
    },
  });

  exports.sendToLagoonTasks = sendToLagoonTasks = async (
    task: string,
    payload: Object,
  ): Promise<string> => {
    try {
      const buffer = Buffer.from(JSON.stringify(payload));
      await channelWrapperTasks.publish('lagoon-tasks', task, buffer, {
        persistent: true,
      });
      logger.debug(
        `lagoon-tasks: Successfully created task '${task}'`,
        payload,
      );
      return `lagoon-tasks: Successfully created task '${task}': ${JSON.stringify(
        payload,
      )}`;
    } catch (error) {
      logger.error('lagoon-tasks: Error send to lagoon-tasks exchange', {
        payload,
        error,
      });
      throw error;
    }
  };

  exports.sendToLagoonTasksMonitor = sendToLagoonTasksMonitor = async (
    task: string,
    payload: Object,
  ): Promise<string> => {
    try {
      const buffer = Buffer.from(JSON.stringify(payload));
      await channelWrapperTasks.publish('lagoon-tasks-monitor', task, buffer, {
        persistent: true,
      });
      logger.debug(
        `lagoon-tasks-monitor: Successfully created monitor '${task}'`,
        payload,
      );
      return `lagoon-tasks-monitor: Successfully created task monitor '${task}': ${JSON.stringify(
        payload,
      )}`;
    } catch (error) {
      logger.error(
        'lagoon-tasks-monitor: Error send to lagoon-tasks-monitor exchange',
        {
          payload,
          error,
        },
      );
      throw error;
    }
  };
}

async function createTaskMonitor(task: string, payload: Object) {
  return sendToLagoonTasksMonitor(task, payload);
}

async function createDeployTask(deployData: Object) {
  const {
    projectName,
    branchName,
    // sha,
    type,
    pullrequestTitle,
  } = deployData;

  const project = await getActiveSystemForProject(projectName, 'deploy');
  const environments = await getEnvironmentsForProject(projectName);

  // environments =
  //  { project:
  //     { environment_deployments_limit: 1,
  //       production_environment: 'master',
  //       environments: [ { name: 'develop', environment_type: 'development' }, [Object] ] } }

  if (typeof project.activeSystemsDeploy === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for tasks 'deploy' in for project ${projectName}`,
    );
  }

  switch (project.activeSystemsDeploy) {
    case 'lagoon_openshiftBuildDeploy':
      if (environments.project.productionEnvironment === branchName) {
        logger.debug(
          `projectName: ${projectName}, branchName: ${branchName}, production environment, no environment limits considered`,
        );
      } else {
        // get a list of non-production environments
        console.log(environments.project);
        const dev_environments = environments.project.environments
          .filter(e => e.environmentType === 'development')
          .map(e => e.name);
        logger.debug(
          `projectName: ${projectName}, branchName: ${branchName}, existing environments are `,
          dev_environments,
        );

        if (
          environments.project.developmentEnvironmentsLimit !== null &&
          dev_environments.length >=
            environments.project.developmentEnvironmentsLimit
        ) {
          if (dev_environments.find(i => i === branchName)) {
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, environment already exists, no environment limits considered`,
            );
          } else {
            throw new EnvironmentLimit(
              `'${branchName}' would exceed the configured limit of ${
                environments.project.developmentEnvironmentsLimit
              } development environments for project ${projectName}`,
            );
          }
        }
      }

      if (type === 'branch') {
        switch (project.branches) {
          case undefined:
          case null:
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, no branches defined in active system, assuming we want all of them`,
            );
            return sendToLagoonTasks('builddeploy-openshift', deployData);
          case 'true':
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, all branches active, therefore deploying`,
            );
            return sendToLagoonTasks('builddeploy-openshift', deployData);
          case 'false':
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, branch deployments disabled`,
            );
            throw new NoNeedToDeployBranch('Branch deployments disabled');
          default: {
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, regex ${
                project.branches
              }, testing if it matches`,
            );
            const branchRegex = new RegExp(project.branches);
            if (branchRegex.test(branchName)) {
              logger.debug(
                `projectName: ${projectName}, branchName: ${branchName}, regex ${
                  project.branches
                } matched branchname, starting deploy`,
              );
              return sendToLagoonTasks('builddeploy-openshift', deployData);
            }
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, regex ${
                project.branches
              } did not match branchname, not deploying`,
            );
            throw new NoNeedToDeployBranch(
              `configured regex '${
                project.branches
              }' does not match branchname '${branchName}'`,
            );
          }
        }
      } else if (type === 'pullrequest') {
        switch (project.pullrequests) {
          case undefined:
          case null:
            logger.debug(
              `projectName: ${projectName}, pullrequest: ${branchName}, no pullrequest defined in active system, assuming we want all of them`,
            );
            return sendToLagoonTasks('builddeploy-openshift', deployData);
          case 'true':
            logger.debug(
              `projectName: ${projectName}, pullrequest: ${branchName}, all pullrequest active, therefore deploying`,
            );
            return sendToLagoonTasks('builddeploy-openshift', deployData);
          case 'false':
            logger.debug(
              `projectName: ${projectName}, pullrequest: ${branchName}, pullrequest deployments disabled`,
            );
            throw new NoNeedToDeployBranch('PullRequest deployments disabled');
          default: {
            logger.debug(
              `projectName: ${projectName}, pullrequest: ${branchName}, regex ${
                project.pullrequests
              }, testing if it matches PR Title '${pullrequestTitle}'`,
            );

            const branchRegex = new RegExp(project.pullrequests);
            if (branchRegex.test(pullrequestTitle)) {
              logger.debug(
                `projectName: ${projectName}, pullrequest: ${branchName}, regex ${
                  project.pullrequests
                } matched PR Title '${pullrequestTitle}', starting deploy`,
              );
              return sendToLagoonTasks('builddeploy-openshift', deployData);
            }
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, regex ${
                project.pullrequests
              } did not match PR Title, not deploying`,
            );
            throw new NoNeedToDeployBranch(
              `configured regex '${
                project.pullrequests
              }' does not match PR Title '${pullrequestTitle}'`,
            );
          }
        }
      }
      break;
    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${
          project.activeSystemsDeploy
        }' for task 'deploy' in for project ${projectName}`,
      );
  }
}

async function createPromoteTask(promoteData: Object) {
  const {
    projectName,
    // branchName,
    // promoteSourceEnvironment,
    // type,
  } = promoteData;

  const project = await getActiveSystemForProject(projectName, 'promote');

  if (typeof project.activeSystemsPromote === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for tasks 'deploy' in for project ${projectName}`,
    );
  }

  switch (project.activeSystemsPromote) {
    case 'lagoon_openshiftBuildDeploy':
      return sendToLagoonTasks('builddeploy-openshift', promoteData);

    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${
          project.activeSystemsPromote
        }' for task 'deploy' in for project ${projectName}`,
      );
  }
}

async function createRemoveTask(removeData: Object) {
  const {
    projectName,
    branch,
    branchName,
    pullrequestNumber,
    pullrequestTitle,
    forceDeleteProductionEnvironment,
    type,
  } = removeData;

  // Load all environments that currently exist (and are not deleted).
  const allEnvironments = await getEnvironmentsForProject(
    projectName,
  );

  // Check to see if we are deleting the production environment, and if so,
  // ensure the flag is set to allow this.
  if (branch === allEnvironments.project.productionEnvironment) {
    if (forceDeleteProductionEnvironment !== true) {
      throw new CannotDeleteProductionEnvironment(
        `'${branch}' is defined as the production environment for ${projectName}, refusing to remove.`,
      );
    }
  }

  const project = await getActiveSystemForProject(projectName, 'remove');

  if (typeof project.activeSystemsRemove === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for tasks 'remove' in for project ${projectName}`,
    );
  }

  switch (project.activeSystemsRemove) {
    case 'lagoon_openshiftRemove':
      if (type === 'branch') {
        // Check to ensure the environment actually exists.
        let foundEnvironment = false;
        allEnvironments.project.environments.forEach(function (environment, index) {
          if (environment.name === branch) {
            foundEnvironment = true;
          }
        });

        if (!foundEnvironment) {
          logger.debug(
            `projectName: ${projectName}, branchName: ${branch}, no environment found.`,
          );
          throw new NoNeedToRemoveBranch('Branch environment does not exist, no need to remove anything.');
        }

        logger.debug(
          `projectName: ${projectName}, branchName: ${branchName}. Removing branch environment.`,
        );
        return sendToLagoonTasks('remove-openshift', removeData);

      } else if (type === 'pullrequest') {
        // Work out the branch name from the PR number.
        let branchName = 'pr-' + pullrequestNumber;
        removeData.branchName = 'pr-' + pullrequestNumber;

        // Check to ensure the environment actually exists.
        let foundEnvironment = false;
        allEnvironments.project.environments.forEach(function (environment, index) {
          if (environment.name === branchName) {
            foundEnvironment = true;
          }
        });

        if (!foundEnvironment) {
          logger.debug(
            `projectName: ${projectName}, pullrequest: ${branchName}, no pullrequest found.`,
          );
          throw new NoNeedToRemoveBranch('Pull Request environment does not exist, no need to remove anything.');
        }

        logger.debug(
          `projectName: ${projectName}, pullrequest: ${branchName}. Removing pullrequest environment.`,
        );
        return sendToLagoonTasks('remove-openshift', removeData);

      } else if (type === 'promote') {
        return sendToLagoonTasks('remove-openshift', removeData);
      }
      break;

    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${
          project.activeSystemsRemove
        }' for task 'remove' in for project ${projectName}`,
      );
  }
}

async function createTaskTask(taskData: Object) {
  const {
    project,
  } = taskData;

  const projectSystem = await getActiveSystemForProject(project.name, 'task');

  if (typeof projectSystem.activeSystemsTask === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for 'task' for project ${project.name}`,
    );
  }

  switch (projectSystem.activeSystemsTask) {
    case 'lagoon_openshiftJob':
      return sendToLagoonTasks('job-openshift', taskData);

    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${
          projectSystem.activeSystemsTask
        }' for 'task' for project ${project.name}`,
      );
  }
}

async function createMiscTask(taskData: Object) {
  return sendToLagoonTasks('misc-openshift', taskData);
}

async function consumeTasks(
  taskQueueName: string,
  messageConsumer: Function,
  retryHandler: Function,
  deathHandler: Function,
) {
  const onMessage = async msg => {
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
          `lagoon-tasks: retryHandler for ${taskQueueName} failed with ${retryError}, will continue to retry the message anyway.`,
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
          'x-retry': retryCount,
        },
        persistent: true,
      };

      // publishing a new message with the same content as the original message but into the `lagoon-tasks-delay` exchange,
      // which will send the message into the original exchange `lagoon-tasks` after waiting the x-delay time.
      channelWrapperTasks.publish(
        'lagoon-tasks-delay',
        msg.fields.routingKey,
        msg.content,
        retryMsgOptions,
      );

      // acknologing the existing message, we cloned it and is not necessary anymore
      channelWrapperTasks.ack(msg);
    }
  };

  const channelWrapperTasks = connection.createChannel({
    setup(channel) {
      return Promise.all([
        channel.assertQueue(`lagoon-tasks:${taskQueueName}`, { durable: true }),
        channel.bindQueue(
          `lagoon-tasks:${taskQueueName}`,
          'lagoon-tasks',
          taskQueueName,
        ),
        channel.prefetch(2),
        channel.consume(`lagoon-tasks:${taskQueueName}`, onMessage, {
          noAck: false,
        }),
      ]);
    },
  });
}

async function consumeTaskMonitor(
  taskMonitorQueueName: string,
  messageConsumer: Function,
  deathHandler: Function,
) {
  const onMessage = async msg => {
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
          'x-retry': retryCount,
        },
        persistent: true,
      };

      // publishing a new message with the same content as the original message but into the `lagoon-tasks-delay` exchange,
      // which will send the message into the original exchange `lagoon-tasks` after waiting the x-delay time.
      channelWrapperTaskMonitor.publish(
        'lagoon-tasks-monitor-delay',
        msg.fields.routingKey,
        msg.content,
        retryMsgOptions,
      );

      // acknologing the existing message, we cloned it and is not necessary anymore
      channelWrapperTaskMonitor.ack(msg);
    }
  };

  const channelWrapperTaskMonitor = connection.createChannel({
    setup(channel) {
      return Promise.all([
        channel.assertQueue(`lagoon-tasks-monitor:${taskMonitorQueueName}`, {
          durable: true,
        }),
        channel.bindQueue(
          `lagoon-tasks-monitor:${taskMonitorQueueName}`,
          'lagoon-tasks-monitor',
          taskMonitorQueueName,
        ),
        channel.prefetch(1),
        channel.consume(
          `lagoon-tasks-monitor:${taskMonitorQueueName}`,
          onMessage,
          { noAck: false },
        ),
      ]);
    },
  });
}
