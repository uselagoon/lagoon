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

const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest"
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest"
const connection = amqp.connect([`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`], { json: true });

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

			// delay exchnage
			channel.assertExchange('amazeeio-webhooks-delay', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'fanout' }}),
			channel.bindExchange('amazeeio-webhooks', 'amazeeio-webhooks-delay', ''),

			channel.prefetch(1),
			channel.consume('amazeeio-webhooks:queue', msg => processWebhook(msg, channelWrapper), {noAck: false}),

		]);
	}
});
