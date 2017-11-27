// @flow

const amqp = require('amqp-connection-manager')
const { logger } = require('./local-logging');

import type { ChannelWrapper } from './types';

const rabbitmqHost = process.env.RABBITMQ_HOST || "rabbitmq"
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest"
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest"
let channelWrapperLogs
exports.initSendToLagoonLogs = initSendToLagoonLogs;
exports.sendToLagoonLogs = sendToLagoonLogs;

function initSendToLagoonLogs() {
	const connection = amqp.connect([`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`], { json: true });

	connection.on('connect', ({ url }) => logger.verbose('lagoon-logs: Connected to %s', url, { action: 'connected', url }));
	connection.on('disconnect', params => logger.error('lagoon-logs: Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

	// Cast any to ChannelWrapper to get type-safetiness through our own code
	channelWrapperLogs = connection.createChannel({
		setup: channel => {
			return Promise.all([
				channel.assertExchange('lagoon-logs', 'direct', {durable: true}),
			]);
		}
	});

}


async function sendToLagoonLogs (severity: string, project: string, uuid: string, event: string, meta: object, message: string): Promise<void> {
		const payload = {severity, project, uuid, event, meta, message}


		try {
			const buffer = new Buffer(JSON.stringify(payload));
			const packageName = process.env.npm_package_name || ""
			const options = {
				persistent: true,
				appId: packageName,
			}
			await channelWrapperLogs.publish(`lagoon-logs`, '', buffer, options );

			logger.log(severity, `lagoon-logs: Send to lagoon-logs: ${message}`);
		} catch(error) {
			logger.error(`lagoon-logs: Error send to rabbitmq lagoon-logs exchange, error: ${error}`);
		}
	}
