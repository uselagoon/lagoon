// @flow

const amqp = require('amqp-connection-manager');
const { logger } = require('./local-logging');

exports.initSendToAmazeeioTasks = initSendToAmazeeioTasks;
exports.createDeployTask = createDeployTask;
exports.createRemoveTask = createRemoveTask;
exports.createTaskMonitor = createTaskMonitor;
exports.consumeTaskMonitor = consumeTaskMonitor;
exports.consumeTasks = consumeTasks;

import type { ChannelWrapper } from './types';

const { getActiveSystemForProject } = require('./api');


let sendToAmazeeioTasks = exports.sendToAmazeeioTasks = function sendToAmazeeioTasks() {};
let sendToAmazeeioTasksMonitor = exports.sendToAmazeeioTasksMonitor = function sendToAmazeeioTasksMonitor() {};
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

function initSendToAmazeeioTasks() {
	connection = amqp.connect([`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`], { json: true });

	connection.on('connect', ({ url }) => logger.verbose('amazeeio-tasks: Connected to %s', url, { action: 'connected', url }));
	connection.on('disconnect', params => logger.error('amazeeio-tasks: Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

	const channelWrapperTasks: ChannelWrapper = connection.createChannel({
		setup(channel) {
			return Promise.all([

				// Our main Exchange for all amazeeio-tasks
				channel.assertExchange('amazeeio-tasks', 'direct', { durable: true}),

				channel.assertExchange('amazeeio-tasks-delay', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'fanout' }}),
				channel.bindExchange('amazeeio-tasks', 'amazeeio-tasks-delay', ''),

				// Exchange for task monitoring
				channel.assertExchange('amazeeio-tasks-monitor', 'direct', { durable: true}),

				channel.assertExchange('amazeeio-tasks-monitor-delay', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'fanout' }}),
				channel.bindExchange('amazeeio-tasks-monitor', 'amazeeio-tasks-monitor-delay', ''),

			]);
		},
	});

	exports.sendToAmazeeioTasks = sendToAmazeeioTasks  = async (task, payload): Promise<void> => {

		try {
			const buffer = new Buffer(JSON.stringify(payload));
			await channelWrapperTasks.publish(`amazeeio-tasks`, task, buffer, { persistent: true })
			logger.debug(`amazeeio-tasks: Successfully created task '${task}'`, payload);
      return `amazeeio-tasks: Successfully created task '${task}': ${JSON.stringify(payload)}`
		} catch(error) {
			logger.error(`amazeeio-tasks: Error send to amazeeio-tasks exchange`, {
				payload,
				error,
			});
      throw error
		}
	}

	exports.sendToAmazeeioTasksMonitor = sendToAmazeeioTasksMonitor = async (task, payload): Promise<void> => {

		try {
			const buffer = new Buffer(JSON.stringify(payload));
			await channelWrapperTasks.publish(`amazeeio-tasks-monitor`, task, buffer, { persistent: true })
			logger.debug(`amazeeio-tasks-monitor: Successfully created monitor '${task}'`, payload);
			return `amazeeio-tasks-monitor: Successfully created task monitor '${task}': ${JSON.stringify(payload)}`
		} catch(error) {
			logger.error(`amazeeio-tasks-monitor: Error send to amazeeio-tasks-monitor exchange`, {
				payload,
				error,
			});
			throw error
		}
	}

}

async function createTaskMonitor(task, payload) { return sendToAmazeeioTasksMonitor(task, payload) }

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
				switch (projectName.branches) {
					case undefined:
						logger.debug(`projectName: ${projectName}, branchName: ${branchName}, no branches defined in active system, assuming we want all of them`)
						return sendToAmazeeioTasks('builddeploy-openshift', deployData);
					case true:
						logger.debug(`projectName: ${projectName}, branchName: ${branchName}, all branches active, therefore deploying`)
						return sendToAmazeeioTasks('builddeploy-openshift', deployData);
					case false:
						logger.debug(`projectName: ${projectName}, branchName: ${branchName}, branch deployments disabled`)
						throw new NoNeedToDeployBranch(`Branch deployments disabled`)
					default:
						logger.debug(`projectName: ${projectName}, branchName: ${branchName}, regex ${project.branches}, testing if it matches`)
						let branchRegex = new RegExp(project.branches);
						if (branchRegex.test(branchName)) {
							logger.debug(`projectName: ${projectName}, branchName: ${branchName}, regex ${project.branches} matched branchname, starting deploy`)
							return sendToAmazeeioTasks('builddeploy-openshift', deployData);
						} else {
							logger.debug(`projectName: ${projectName}, branchName: ${branchName}, regex ${project.branches} did not match branchname, not deploying`)
							throw new NoNeedToDeployBranch(`configured regex '${project.branches}' does not match branchname '${branchName}'`)
						}
				}
			} else if (type === 'pullrequest') {
				switch (projectName.pullrequests) {
					case undefined:
						logger.debug(`projectName: ${projectName}, pullrequest: ${branchName}, no pullrequest defined in active system, assuming we want all of them`)
						return sendToAmazeeioTasks('builddeploy-openshift', deployData);
					case true:
						logger.debug(`projectName: ${projectName}, pullrequest: ${branchName}, all pullrequest active, therefore deploying`)
						return sendToAmazeeioTasks('builddeploy-openshift', deployData);
					case false:
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
		projectName
	} = removeData

  let activeSystems = await getActiveSystemForProject(projectName, 'remove');

	if (typeof project.active_systems_remove === 'undefined') {
    throw new UnknownActiveSystem(`No active system for tasks 'remove' in for project ${projectName}`)
	}

	switch (project.active_systems_remove) {
		case 'lagoon_openshiftRemove':
			return sendToAmazeeioTasks('remove-openshift', removeData);

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
				logger.info(`amazeeio-tasks: retryHandler for ${taskQueueName} failed with ${error}, will continue to retry the message anyway.`)
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

			// publishing a new message with the same content as the original message but into the `amazeeio-tasks-delay` exchange,
			// which will send the message into the original exchange `amazeeio-tasks` after waiting the x-delay time.
			channelWrapperTasks.publish(`amazeeio-tasks-delay`, msg.fields.routingKey, msg.content, retryMsgOptions)

			// acknologing the existing message, we cloned it and is not necessary anymore
			channelWrapperTasks.ack(msg)
		}
	}

	const channelWrapperTasks = connection.createChannel({
		setup(channel) {
			return Promise.all([
				channel.assertQueue(`amazeeio-tasks:${taskQueueName}`, { durable: true }),
				channel.bindQueue(`amazeeio-tasks:${taskQueueName}`, 'amazeeio-tasks', taskQueueName),
				channel.prefetch(2),
				channel.consume(`amazeeio-tasks:${taskQueueName}`, onMessage, { noAck: false }),
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

				// publishing a new message with the same content as the original message but into the `amazeeio-tasks-delay` exchange,
				// which will send the message into the original exchange `amazeeio-tasks` after waiting the x-delay time.
				channelWrapperTaskMonitor.publish(`amazeeio-tasks-monitor-delay`, msg.fields.routingKey, msg.content, retryMsgOptions)

				// acknologing the existing message, we cloned it and is not necessary anymore
				channelWrapperTaskMonitor.ack(msg)
			}
		}

		const channelWrapperTaskMonitor = connection.createChannel({
			setup(channel) {
				return Promise.all([
					channel.assertQueue(`amazeeio-tasks-monitor:${taskMonitorQueueName}`, { durable: true }),
					channel.bindQueue(`amazeeio-tasks-monitor:${taskMonitorQueueName}`, 'amazeeio-tasks-monitor', taskMonitorQueueName),
					channel.prefetch(1),
					channel.consume(`amazeeio-tasks-monitor:${taskMonitorQueueName}`, onMessage, { noAck: false }),
				]);
			},
		});


	}