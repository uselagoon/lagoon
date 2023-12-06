import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { initSendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { initSendToLagoonTasks } from '@lagoon/commons/dist/tasks';
import { processQueue } from './processQueue';

initSendToLagoonLogs();
initSendToLagoonTasks();

const rabbitmqHost = process.env.RABBITMQ_HOST || "broker"
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest"
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest"

// @ts-ignore
const connection = amqp.connect([`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`], { json: true });

connection.on('connect', ({ url }) => logger.verbose('Connected to %s', url, { action: 'connected', url }));
// @ts-ignore
connection.on('disconnect', params => logger.error('Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

// Cast any to ChannelWrapper to get type-safetiness through our own code
const channelWrapperWebhooks: ChannelWrapper = connection.createChannel({
	setup: channel => {
		return Promise.all([

			// Our main Exchange for all lagoon-webhooks
			channel.assertExchange('lagoon-webhooks', 'direct', { durable: true }),

			// Queue which is bound to the exachange
			channel.assertQueue('lagoon-webhooks:queue', { durable: true }),
			channel.bindQueue('lagoon-webhooks:queue', 'lagoon-webhooks', ''),

			// delay exchnage
			channel.assertExchange('lagoon-webhooks-delay', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'fanout' }}),
			channel.bindExchange('lagoon-webhooks', 'lagoon-webhooks-delay', ''),

			// handle up to four messages at the same time
			channel.prefetch(4),

			channel.consume('lagoon-webhooks:queue', msg => {processQueue(msg, channelWrapperWebhooks)}, {noAck: false}),

		]);
	}
});
