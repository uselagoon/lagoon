// @flow

const amqp = require('amqp-connection-manager');
const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { sendToAmazeeioLogs, initSendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { sendToAmazeeioTasks, initSendToAmazeeioTasks } = require('@amazeeio/lagoon-commons/src/tasks');

const processWebhook = require('./processWebhook');

import type { ChannelWrapper } from './types';



initSendToAmazeeioLogs();
initSendToAmazeeioTasks();

const rabbitmqHost = process.env.RABBITMQ_HOST || "rabbitmq"
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest"
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest"
const connection = amqp.connect([`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`], { json: true });

connection.on('connect', ({ url }) => logger.verbose('Connected to %s', url, { action: 'connected', url }));
connection.on('disconnect', params => logger.error('Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

// Cast any to ChannelWrapper to get type-safetiness through our own code
const channelWrapperWebhooks: ChannelWrapper = connection.createChannel({
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
			channel.consume('amazeeio-webhooks:queue', msg => {processWebhook(msg, channelWrapperWebhooks)}, {noAck: false}),

		]);
	}
});
