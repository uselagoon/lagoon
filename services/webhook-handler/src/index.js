// @flow

require("babel-polyfill");

import http from 'http';
import events from 'events';

import amqp from 'amqp-connection-manager';

import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';
import createReqHandler from './createReqHandler';

import type { ChannelWrapper } from './types';

// Initialize the logging mechanism
initLogger();

const rabbitmqhost = process.env.RABBITMQ_HOST || "localhost"
const port = process.env.PORT || 3000
const connection = amqp.connect([`amqp://${rabbitmqhost}`], { json: true });

connection.on('connect', ({ url }) => logger.verbose('Connected to %s', url, { action: 'connected', url }));
connection.on('disconnect', params => logger.error('Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

// Cast any to ChannelWrapper to get type-safetiness through our own code
const channelWrapper: ChannelWrapper = connection.createChannel({
	setup: channel => {
		return Promise.all([
			channel.assertExchange('amazeeio-webhooks', 'direct', { durable: true }),
		]);
	}
});

const handler = createReqHandler({ path: '/', channelWrapper });

http.createServer((req, res) => {
  const { method, url, headers } = req;

	logger.verbose('New %s request to %s', method, url, {
    action: 'new-request',
    method,
    url,
    headers,
  });

	handler(req, res, logger, (err) => {
		res.statusCode = 404
		res.end('no such location')
	});
}).listen(port);
