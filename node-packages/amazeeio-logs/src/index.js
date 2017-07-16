// @flow

import amqp from 'amqp-connection-manager';
import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';

import type { ChannelWrapper } from './types';

initLogger();

export let sendToAmazeeioLogs = () => {};
const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest"
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest"

export function initSendToAmazeeioLogs() {
	const connection = amqp.connect([`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`], { json: true });

	connection.on('connect', ({ url }) => logger.verbose('amazeeio-logs: Connected to %s', url, { action: 'connected', url }));
	connection.on('disconnect', params => logger.error('amazeeio-logs: Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

	// Cast any to ChannelWrapper to get type-safetiness through our own code
	const channelWrapper: ChannelWrapper = connection.createChannel({
		setup: channel => {
			return Promise.all([
				channel.assertExchange('amazeeio-logs', 'direct', {durable: true}),
			]);
		}
	});
	sendToAmazeeioLogs = async (severity: string, sitegroup: string, uuid: string, event: string, meta: object, message: string): Promise<void> => {

		const payload = {severity, sitegroup, uuid, event, meta, message}


		try {
			const buffer = new Buffer(JSON.stringify(payload));
			const packageName = process.env.npm_package_name || ""
			const options = {
				persistent: true,
				appId: packageName,
			}
			await channelWrapper.publish(`amazeeio-logs`, '', buffer, options );

			logger.log(severity, `amazeeio-logs: Send to amazeeio-logs: ${message}`);
		} catch(error) {
			logger.error(`amazeeio-logs: Error send to rabbitmq amazeeio-logs exchange, error: ${error}`);
		}
	}

}