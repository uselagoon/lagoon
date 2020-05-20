// @flow

const amqp = require('amqp-connection-manager');
const { logger } = require('@lagoon/commons/dist/local-logging');
const readFromRabbitMQ = require('./readFromRabbitMQ');

import type { ChannelWrapper } from './types';

const rabbitmqHost = process.env.RABBITMQ_HOST || "broker"
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest"
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest"
const connection = amqp.connect([`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`], { json: true });

connection.on('connect', ({ url }) => logger.verbose('Connected to %s', url, { action: 'connected', url }));
connection.on('disconnect', params => logger.error('Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

// Cast any to ChannelWrapper to get type-safetiness through our own code
const channelWrapperLogs: ChannelWrapper = connection.createChannel({
	setup: channel => {
		return Promise.all([
			channel.assertExchange('lagoon-logs', 'direct', {durable: true}),
			channel.assertQueue('lagoon-logs:email', {durable: true}),
			channel.bindQueue('lagoon-logs:email', 'lagoon-logs', ''),
			channel.prefetch(1),
			channel.consume('lagoon-logs:email', msg => readFromRabbitMQ(msg, channelWrapperLogs), {noAck: false}),
		]);
	}
});
