// @flow

import amqp from 'amqp-connection-manager';
import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';


import type { ChannelWrapper } from './types';

import { getActiveSystemsForSiteGroup } from '@amazeeio/amazeeio-api';


export let sendToAmazeeioTasks = () => {};
export let connection = () => {};
const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest"
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest"

initLogger();

export class UnknownActiveSystem extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownActiveSystem';
  }
}

export class NoNeedToDeployBranch extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoNeedToDeployBranch';
  }
}

export function initSendToAmazeeioTasks() {
	connection = amqp.connect([`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`], { json: true });

	connection.on('connect', ({ url }) => logger.verbose('amazeeio-tasks: Connected to %s', url, { action: 'connected', url }));
	connection.on('disconnect', params => logger.error('amazeeio-tasks: Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

	const channelWrapper: ChannelWrapper = connection.createChannel({
		setup(channel) {
			return Promise.all([

				// Our main Exchange for all amazeeio-tasks
				channel.assertExchange('amazeeio-tasks', 'direct', { durable: true}),

				channel.assertExchange('amazeeio-tasks-delay', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'fanout' }}),
				channel.bindExchange('amazeeio-tasks', 'amazeeio-tasks-delay', ''),


			]);
		},
	});

	sendToAmazeeioTasks = async (task, payload): Promise<void> => {

		try {
			const buffer = new Buffer(JSON.stringify(payload));
			await channelWrapper.publish(`amazeeio-tasks`, task, buffer, { persistent: true })
			logger.debug(`amazeeio-tasks: Successfully created task '${task}'`, payload);
      return `amazeeio-tasks: Successfully created task '${task}': ${JSON.stringify(payload)}`
		} catch(error) {
			logger.error(`amazeeio-tasks: Error send to amazeeio-task exchange`, {
				payload,
				error,
			});
      throw error
		}
	}

}

export async function createDeployTask(deployData) {
	const {
		siteGroupName,
		branchName,
		sha,
		type
	} = deployData

  let activeSystems = await getActiveSystemsForSiteGroup(siteGroupName);

	if (typeof activeSystems.deploy === 'undefined') {
    throw new UnknownActiveSystem(`No active system for tasks 'deploy' in for sitegroup ${siteGroupName}`)
	}

	// BC: the given active Systems were just a string in the past, now they are an object with the active system as a key
	if (typeof activeSystems.deploy === 'string') {
		const activeSystem = activeSystems.deploy
		activeSystems.deploy = {}
		activeSystems.deploy[activeSystem] = {}
	}

	// We only check the first given System, we could also allow multiple, but it's better to just create another sitegroup with the same gitURL
	const activeDeploySystem = Object.keys(activeSystems.deploy)[0]

	switch (activeDeploySystem) {
		case 'lagoon_openshift':
		case 'lagoon_openshiftLegacy':
			// this is the old legacy system which does not create projects
			const legacyDeploySystemConfig = activeSystems.deploy['lagoon_openshift']
			if (type === 'branch') {
				switch (legacyDeploySystemConfig.branches) {
					case undefined:
						logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, no branches defined in active system, assuming we want all of them`)
						return sendToAmazeeioTasks('deploy-openshift-legacy', deployData);
					case true:
						logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, all branches active, therefore deploying`)
						return sendToAmazeeioTasks('deploy-openshift-legacy', deployData);
					case false:
						logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, branch deployments disabled`)
						throw new NoNeedToDeployBranch(`Branch deployments disabled`)
					default:
						logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, regex ${legacyDeploySystemConfig.branches}, testing if it matches`)
						let branchRegex = new RegExp(legacyDeploySystemConfig.branches);
						if (branchRegex.test(branchName)) {
							logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, regex ${legacyDeploySystemConfig.branches} matched branchname, starting deploy`)
							return sendToAmazeeioTasks('deploy-openshift-legacy', deployData);
						} else {
							logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, regex ${legacyDeploySystemConfig.branches} did not match branchname, not deploying`)
							throw new NoNeedToDeployBranch(`configured regex '${legacyDeploySystemConfig.branches}' does not match branchname '${branchName}'`)
						}
				}
			}
		case 'lagoon_openshiftDeploy':
			const deploySystemConfig = activeSystems.deploy['lagoon_openshiftDeploy']
			if (type === 'branch') {
				switch (deploySystemConfig.branches) {
					case undefined:
						logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, no branches defined in active system, assuming we want all of them`)
						return sendToAmazeeioTasks('deploy-openshift', deployData);
					case true:
						logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, all branches active, therefore deploying`)
						return sendToAmazeeioTasks('deploy-openshift', deployData);
					case false:
						logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, branch deployments disabled`)
						throw new NoNeedToDeployBranch(`Branch deployments disabled`)
					default:
						logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, regex ${deploySystemConfig.branches}, testing if it matches`)
						let branchRegex = new RegExp(deploySystemConfig.branches);
						if (branchRegex.test(branchName)) {
							logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, regex ${deploySystemConfig.branches} matched branchname, starting deploy`)
							return sendToAmazeeioTasks('deploy-openshift', deployData);
						} else {
							logger.debug(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, regex ${deploySystemConfig.branches} did not match branchname, not deploying`)
							throw new NoNeedToDeployBranch(`configured regex '${deploySystemConfig.branches}' does not match branchname '${branchName}'`)
						}
				}
			}
		default:
      throw new UnknownActiveSystem(`Unknown active system '${activeDeploySystem}' for task 'deploy' in for sitegroup ${siteGroupName}`)
	}
}

export async function createRemoveTask(removeData) {
	const {
		siteGroupName,
		openshiftRessourceAppName,
	} = removeData

  let activeSystems = await getActiveSystemsForSiteGroup(siteGroupName);

	if (typeof activeSystems.remove === 'undefined') {
    throw new UnknownActiveSystem(`No active system for tasks 'deploy' in for sitegroup ${siteGroupName}`)
	}

	// BC: the given active Systems were just a string in the past, now they are an object with the active system as a key
	if (typeof activeSystems.remove === 'string') {
		const activeSystem = activeSystems.remove
		activeSystems.remove = {}
		activeSystems.remove[activeSystem] = {}
	}

	// We only check the first given System, we could also allow multiple, but it's better to just create another sitegroup with the same gitURL
	const activeRemoveSystem = Object.keys(activeSystems.remove)[0]

	switch (activeRemoveSystem) {
		case 'lagoon_openshiftLegacy':
		case 'lagoon_openshift':
			// this is the old legacy system that tries to remove resources within one shared project
			return sendToAmazeeioTasks('remove-openshift-resources-legacy', removeData);

		case 'lagoon_openshiftRemove':
			return sendToAmazeeioTasks('remove-openshift-resources', removeData);

		default:
      throw new UnknownActiveSystem(`Unknown active system '${activeRemoveSystem}' for task 'remove' in for sitegroup ${siteGroupName}`)
	}
}

export async function consumeTasks(taskQueueName, messageConsumer, retryHandler, deathHandler) {


	const  onMessage = async msg => {
		try {
			await messageConsumer(msg)
			channelWrapper.ack(msg)
		} catch (error) {
			// We land here if the messageConsumer has an error that it did not itslef handle.
			// This is how the consumer informs us that we it would like to retry the message in a couple of seconds

			const retryCount = msg.properties.headers["x-retry"] ? (msg.properties.headers["x-retry"] + 1) : 1

			if (retryCount > 3) {
				channelWrapper.ack(msg)
				deathHandler(msg, error)
				return
			}

			const retryDelaySecs = Math.pow(10, retryCount);
			const retryDelayMilisecs = retryDelaySecs * 1000;

			try {
				retryHandler(msg, error, failCount, retryDelaySecs)
			} catch (error) {
				// intentionally empty as we don't want to fail and not requeue our message just becase the retryHandler fails
			}

			// copying options from the original message
			const retryMsgOptions = {
				appId: msg.properties.appId,
				timestamp: msg.properties.timestamp,
				contentType: msg.properties.contentType,
				deliveryMode: msg.properties.deliveryMode,
				headers: { ...msg.properties.headers, 'x-delay': retryDelayMilisecs, 'x-retry' : retryCount},
				persistent: true,
			};

			// publishing a new message with the same content as the original message but into the `amazeeio-tasks-delay` exchange,
			// which will send the message into the original exchange `amazeeio-tasks` after waiting the x-delay time.
			channelWrapper.publish(`amazeeio-tasks-delay`, msg.fields.routingKey, msg.content, retryMsgOptions)

			// acknologing the existing message, we cloned it and is not necessary anymore
			channelWrapper.ack(msg)
		}
	}

	const channelWrapper = connection.createChannel({
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