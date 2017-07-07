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

			// Our main Exchange for all amazeeio-webhooks
			channel.assertExchange('amazeeio-webhooks', 'direct', { durable: true }),

			// Queue which is bound to the exachange
			channel.assertQueue('amazeeio-webhooks:queue', { durable: true }),
			channel.bindQueue('amazeeio-webhooks:queue', 'amazeeio-webhooks', ''),

			// wait queues for handling retries
			channel.assertExchange('amazeeio-webhooks-retry', 'direct', { durable: true }),
			channel.assertQueue('amazeeio-webhooks:retry-queue', { durable: true, arguments: { 'x-dead-letter-exchange': 'amazeeio-webhooks' } }),
			channel.bindQueue('amazeeio-webhooks:retry-queue', 'amazeeio-webhooks-retry', ''),

			channel.prefetch(1),
			channel.consume('amazeeio-webhooks:queue', msg => processWebhook(msg, channelWrapper), {noAck: false}),

		]);
	}
});
