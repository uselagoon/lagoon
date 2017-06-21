// @flow

require("babel-polyfill");

import amqp from 'amqp-connection-manager';

import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';
import { sendToAmazeeioLogs, initSendToAmazeeioLogs } from '@amazeeio/amazeeio-logs';
import { sendToAmazeeioTasks, initSendToAmazeeioTasks } from '@amazeeio/amazeeio-tasks';

import processWebhook from './processWebhook';

import type { ChannelWrapper } from './types';

// Initialize the logging mechanism
initLogger();
initSendToAmazeeioLogs();
initSendToAmazeeioTasks();

const rabbitmqhost = process.env.RABBITMQ_HOST || "localhost"
const connection = amqp.connect([`amqp://${rabbitmqhost}`], { json: true });

connection.on('connect', ({ url }) => logger.verbose('Connected to %s', url, { action: 'connected', url }));
connection.on('disconnect', params => logger.error('Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

// Cast any to ChannelWrapper to get type-safetiness through our own code
const channelWrapper: ChannelWrapper = connection.createChannel({
	setup: channel => {
		return Promise.all([
			channel.assertQueue('amazeeio-webhooks', {durable: true}),
			channel.prefetch(1),
			channel.consume('amazeeio-webhooks', msg => processWebhook(msg, channelWrapper), {noAck: false}),
		]);
	}
});
