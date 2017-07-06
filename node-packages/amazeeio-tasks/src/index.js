// @flow

import amqp from 'amqp-connection-manager';
import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';

import type { ChannelWrapper } from './types';

import { getActiveSystemsForSiteGroup } from '@amazeeio/amazeeio-api';


export let sendToAmazeeioTasks = () => {};
const rabbitmqhost = process.env.RABBITMQ_HOST || "localhost"

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
	const connection = amqp.connect([`amqp://${rabbitmqhost}`], { json: true });

	connection.on('connect', ({ url }) => logger.verbose('amazeeio-tasks: Connected to %s', url, { action: 'connected', url }));
	connection.on('disconnect', params => logger.error('amazeeio-tasks: Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

	// Cast any to ChannelWrapper to get type-safetiness through our own code
	const channelWrapper: ChannelWrapper = connection.createChannel();
	sendToAmazeeioTasks = async (task, payload): Promise<void> => {

		try {
			const buffer = new Buffer(JSON.stringify(payload));
			await channelWrapper.sendToQueue(`amazeeio-tasks:${task}`, buffer, { persistent: true })
			logger.verbose(`amazeeio-tasks: Successfully created task '${task}'`, payload);
      return `amazeeio-tasks: Successfully created task '${task}': ${JSON.stringify(payload)}`
		} catch(error) {
			logger.error(`amazeeio-tasks: Error send to amazeeio-task queue`, {
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
			const deploySystemConfig = activeSystems.deploy['lagoon_openshift']
			if (type === 'branch') {
				switch (deploySystemConfig.branches) {
					case undefined:
						logger.verbose(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, no branches defined in active system, assuming we want all of them`)
						return sendToAmazeeioTasks('deploy-openshift', deployData);
					case true:
						logger.verbose(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, all branches active, therefore deploying`)
						return sendToAmazeeioTasks('deploy-openshift', deployData);
					case false:
						logger.verbose(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, branch deployments disabled`)
						throw new NoNeedToDeployBranch(`Branch deployments disabled`)
					default:
						logger.verbose(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, regex ${deploySystemConfig.branches}, testing if it matches`)
						let branchRegex = new RegExp(deploySystemConfig.branches);
						if (branchRegex.test(branchName)) {
							logger.verbose(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, regex ${deploySystemConfig.branches} matched branchname, starting deploy`)
							return sendToAmazeeioTasks('deploy-openshift', deployData);
						} else {
							logger.verbose(`siteGroupName: ${siteGroupName}, branchName: ${branchName}, regex ${deploySystemConfig.branches} did not match branchname, not deploying`)
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
		case 'lagoon_openshift':
			return sendToAmazeeioTasks('remove-openshift-resources', removeData);

		default:
      throw new UnknownActiveSystem(`Unknown active system '${activeRemoveSystem}' for task 'remove' in for sitegroup ${siteGroupName}`)
	}
}