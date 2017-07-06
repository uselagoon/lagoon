// @flow

import amqp from 'amqp-connection-manager';
import { logger, initLogger } from './logging';

import hostname from 'os';

import type { ChannelWrapper } from './types';

initLogger();

export let sendToAmazeeioLogs = () => {};
const rabbitmqhost = process.env.RABBITMQ_HOST || "localhost"

export function initSendToAmazeeioLogs() {
	const connection = amqp.connect([`amqp://${rabbitmqhost}`], { json: true });

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
			const options = {
				persistent: true,
				headers: {
					hostname: hostname()
				},

			}
			await channelWrapper.publish(`amazeeio-logs`, '', buffer, options );

			logger.verbose(`amazeeio-logs: Successfully send to amazeeio-logs: ${message}`);
		} catch(error) {
			logger.error(`amazeeio-logs: Error send to amazeeio-logs queuing`, {
				severity,
				sitegroup,
				uuid,
				event,
				meta,
				message,
				error,
			});
		}
	}

}