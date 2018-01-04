// @flow

const amqp = require('amqp-connection-manager');
const { logger } = require('./local-logging');

exports.initSendToLagoonTasks = initSendToLagoonTasks;
exports.createDeployTask = createDeployTask;
exports.createRemoveTask = createRemoveTask;
exports.createTaskMonitor = createTaskMonitor;
exports.consumeTaskMonitor = consumeTaskMonitor;
exports.consumeTasks = consumeTasks;

import type { ChannelWrapper } from './types';

const { getActiveSystemForProject, getProductionEnvironmentForProject } = require('./api');


let sendToLagoonTasks = exports.sendToLagoonTasks = function sendToLagoonTasks() {};
let sendToLagoonTasksMonitor = exports.sendToLagoonTasksMonitor = function sendToLagoonTasksMonitor() {};
let connection = exports.connection = function connection() {};
const rabbitmqHost = process.env.RABBITMQ_HOST || "rabbitmq"
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest"
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest"

const _extends = Object.assign || function(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };


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

class CannotDeleteProductionEnvironment extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CannotDeleteProductionEnvironment';
  }
}


function initSendToLagoonTasks() {
	connection = amqp.connect([`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`], { json: true });

	connection.on('connect', ({ url }) => logger.verbose('lagoon-tasks: Connected to %s', url, { action: 'connected', url }));
	connection.on('disconnect', params => logger.error('lagoon-tasks: Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

	const channelWrapperTasks: ChannelWrapper = connection.createChannel({
		setup(channel) {
			return Promise.all([

				// Our main Exchange for all lagoon-tasks
				channel.assertExchange('lagoon-tasks', 'direct', { durable: true}),

				channel.assertExchange('lagoon-tasks-delay', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'fanout' }}),
				channel.bindExchange('lagoon-tasks', 'lagoon-tasks-delay', ''),

				// Exchange for task monitoring
				channel.assertExchange('lagoon-tasks-monitor', 'direct', { durable: true}),

				channel.assertExchange('lagoon-tasks-monitor-delay', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'fanout' }}),
				channel.bindExchange('lagoon-tasks-monitor', 'lagoon-tasks-monitor-delay', ''),

			]);
		},
	});

	exports.sendToLagoonTasks = sendToLagoonTasks  = async (task, payload): Promise<void> => {

		try {
			const buffer = new Buffer(JSON.stringify(payload));
			await channelWrapperTasks.publish(`lagoon-tasks`, task, buffer, { persistent: true })
			logger.debug(`lagoon-tasks: Successfully created task '${task}'`, payload);
      return `lagoon-tasks: Successfully created task '${task}': ${JSON.stringify(payload)}`
		} catch(error) {
			logger.error(`lagoon-tasks: Error send to lagoon-tasks exchange`, {
				payload,
				error,
			});
      throw error
		}
	}

	exports.sendToLagoonTasksMonitor = sendToLagoonTasksMonitor = async (task, payload): Promise<void> => {

		try {
			const buffer = new Buffer(JSON.stringify(payload));
			await channelWrapperTasks.publish(`lagoon-tasks-monitor`, task, buffer, { persistent: true })
			logger.debug(`lagoon-tasks-monitor: Successfully created monitor '${task}'`, payload);
			return `lagoon-tasks-monitor: Successfully created task monitor '${task}': ${JSON.stringify(payload)}`
		} catch(error) {
			logger.error(`lagoon-tasks-monitor: Error send to lagoon-tasks-monitor exchange`, {
				payload,
				error,
			});
			throw error
		}
	}

}

async function createTaskMonitor(task, payload) { return sendToLagoonTasksMonitor(task, payload) }

async function createDeployTask(deployData) {
	const {
		projectName,
		branchName,
		sha,
		type
	} = deployData

  let project = await getActiveSystemForProject(projectName, 'deploy');

	if (typeof project.active_systems_deploy === 'undefined') {
    throw new UnknownActiveSystem(`No active system for tasks 'deploy' in for project ${projectName}`)
	}

	switch (project.active_systems_deploy) {
		case 'lagoon_openshiftBuildDeploy':
			if (type === 'branch') {
				switch (project.branches) {
					case undefined:
					case null:
						logger.debug(`projectName: ${projectName}, branchName: ${branchName}, no branches defined in active system, assuming we want all of them`)
						return sendToLagoonTasks('builddeploy-openshift', deployData);
					case "true":
						logger.debug(`projectName: ${projectName}, branchName: ${branchName}, all branches active, therefore deploying`)
						return sendToLagoonTasks('builddeploy-openshift', deployData);
					case "false":
						logger.debug(`projectName: ${projectName}, branchName: ${branchName}, branch deployments disabled`)
						throw new NoNeedToDeployBranch(`Branch deployments disabled`)
					default:
						logger.debug(`projectName: ${projectName}, branchName: ${branchName}, regex ${project.branches}, testing if it matches`)
						let branchRegex = new RegExp(project.branches);
						if (branchRegex.test(branchName)) {
							logger.debug(`projectName: ${projectName}, branchName: ${branchName}, regex ${project.branches} matched branchname, starting deploy`)
							return sendToLagoonTasks('builddeploy-openshift', deployData);
						} else {
							logger.debug(`projectName: ${projectName}, branchName: ${branchName}, regex ${project.branches} did not match branchname, not deploying`)
							throw new NoNeedToDeployBranch(`configured regex '${project.branches}' does not match branchname '${branchName}'`)
						}
				}
			} else if (type === 'pullrequest') {
				switch (project.pullrequests) {
					case undefined:
					case null:
						logger.debug(`projectName: ${projectName}, pullrequest: ${branchName}, no pullrequest defined in active system, assuming we want all of them`)
						return sendToLagoonTasks('builddeploy-openshift', deployData);
					case "true":
						logger.debug(`projectName: ${projectName}, pullrequest: ${branchName}, all pullrequest active, therefore deploying`)
						return sendToLagoonTasks('builddeploy-openshift', deployData);
					case "false":
						logger.debug(`projectName: ${projectName}, pullrequest: ${branchName}, pullrequest deployments disabled`)
						throw new NoNeedToDeployBranch(`PullRequest deployments disabled`)
					default:
						logger.debug(`projectName: ${projectName}, pullrequest: ${branchName}, no pull request pattern matching implemeted yet.`)
						throw new NoNeedToDeployBranch(`No Pull Request pattern matching implemented yet`)
						// @TODO Implement pullrequest pattern matching
				}
			}
		default:
      throw new UnknownActiveSystem(`Unknown active system '${project.active_systems_deploy}' for task 'deploy' in for project ${projectName}`)
	}
}

async function createRemoveTask(removeData) {
	const {
		projectName,
		branch,
		forceDeleteProductionEnvironment
	} = removeData

	let production_environment = await getProductionEnvironmentForProject(projectName);

	if (branch === production_environment.project.production_environment) {
		if (forceDeleteProductionEnvironment !== true) {
			throw new CannotDeleteProductionEnvironment(`'${branch}' is defined as the production environment for ${projectName}, refusing to remove.`)
		}
	}

  let project = await getActiveSystemForProject(projectName, 'remove');

	if (typeof project.active_systems_remove === 'undefined') {
    throw new UnknownActiveSystem(`No active system for tasks 'remove' in for project ${projectName}`)
	}

	switch (project.active_systems_remove) {
		case 'lagoon_openshiftRemove':
			return sendToLagoonTasks('remove-openshift', removeData);

		default:
		throw new UnknownActiveSystem(`Unknown active system '${project.active_systems_remove}' for task 'remove' in for project ${projectName}`)
	}
}

async function consumeTasks(taskQueueName, messageConsumer, retryHandler, deathHandler) {


	const  onMessage = async msg => {
		try {
			await messageConsumer(msg)
			channelWrapperTasks.ack(msg)
		} catch (error) {
			// We land here if the messageConsumer has an error that it did not itslef handle.
			// This is how the consumer informs us that we it would like to retry the message in a couple of seconds

			const retryCount = msg.properties.headers["x-retry"] ? (msg.properties.headers["x-retry"] + 1) : 1

			if (retryCount > 3) {
				channelWrapperTasks.ack(msg)
				deathHandler(msg, error)
				return
			}

			const retryDelaySecs = Math.pow(10, retryCount);
			const retryDelayMilisecs = retryDelaySecs * 1000;

			try {
				retryHandler(msg, error, retryCount, retryDelaySecs)
			} catch (error) {
				// intentionally empty as we don't want to fail and not requeue our message just becase the retryHandler fails
				logger.info(`lagoon-tasks: retryHandler for ${taskQueueName} failed with ${error}, will continue to retry the message anyway.`)
			}

			// copying options from the original message
			const retryMsgOptions = {
				appId: msg.properties.appId,
				timestamp: msg.properties.timestamp,
				contentType: msg.properties.contentType,
				deliveryMode: msg.properties.deliveryMode,
				headers: _extends({}, msg.properties.headers, { 'x-delay': retryDelayMilisecs, 'x-retry': retryCount }),
				persistent: true,
			};

			// publishing a new message with the same content as the original message but into the `lagoon-tasks-delay` exchange,
			// which will send the message into the original exchange `lagoon-tasks` after waiting the x-delay time.
			channelWrapperTasks.publish(`lagoon-tasks-delay`, msg.fields.routingKey, msg.content, retryMsgOptions)

			// acknologing the existing message, we cloned it and is not necessary anymore
			channelWrapperTasks.ack(msg)
		}
	}

	const channelWrapperTasks = connection.createChannel({
		setup(channel) {
			return Promise.all([
				channel.assertQueue(`lagoon-tasks:${taskQueueName}`, { durable: true }),
				channel.bindQueue(`lagoon-tasks:${taskQueueName}`, 'lagoon-tasks', taskQueueName),
				channel.prefetch(2),
				channel.consume(`lagoon-tasks:${taskQueueName}`, onMessage, { noAck: false }),
			]);
		},
	});


}


async function consumeTaskMonitor(taskMonitorQueueName, messageConsumer, deathHandler) {


		const  onMessage = async msg => {
			try {
				await messageConsumer(msg)
				channelWrapperTaskMonitor.ack(msg)
			} catch (error) {
				// We land here if the messageConsumer has an error that it did not itslef handle.
				// This is how the consumer informs us that we it would like to retry the message in a couple of seconds

				const retryCount = msg.properties.headers["x-retry"] ? (msg.properties.headers["x-retry"] + 1) : 1

				if (retryCount > 250) {
					channelWrapperTaskMonitor.ack(msg)
					deathHandler(msg, error)
					return
				}

				const retryDelayMilisecs = 5000;

				// copying options from the original message
				const retryMsgOptions = {
					appId: msg.properties.appId,
					timestamp: msg.properties.timestamp,
					contentType: msg.properties.contentType,
					deliveryMode: msg.properties.deliveryMode,
					headers: _extends({}, msg.properties.headers, { 'x-delay': retryDelayMilisecs, 'x-retry': retryCount }),
					persistent: true,
				};

				// publishing a new message with the same content as the original message but into the `lagoon-tasks-delay` exchange,
				// which will send the message into the original exchange `lagoon-tasks` after waiting the x-delay time.
				channelWrapperTaskMonitor.publish(`lagoon-tasks-monitor-delay`, msg.fields.routingKey, msg.content, retryMsgOptions)

				// acknologing the existing message, we cloned it and is not necessary anymore
				channelWrapperTaskMonitor.ack(msg)
			}
		}

		const channelWrapperTaskMonitor = connection.createChannel({
			setup(channel) {
				return Promise.all([
					channel.assertQueue(`lagoon-tasks-monitor:${taskMonitorQueueName}`, { durable: true }),
					channel.bindQueue(`lagoon-tasks-monitor:${taskMonitorQueueName}`, 'lagoon-tasks-monitor', taskMonitorQueueName),
					channel.prefetch(1),
					channel.consume(`lagoon-tasks-monitor:${taskMonitorQueueName}`, onMessage, { noAck: false }),
				]);
			},
		});


	}