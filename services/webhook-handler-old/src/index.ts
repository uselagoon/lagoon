// // Handle signals properly
// // see: https://github.com/nodejs/node-v0.x-archive/issues/9131
// exitOnSignal('SIGINT');
// exitOnSignal('SIGTERM');

// function exitOnSignal(signal) {
//   process.on(signal, function() {
//     console.log('\ncaught ' + signal + ', exiting');
//     // perform all required cleanup
//     process.exit(0);
//   });
// }

import http from 'http';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { createReqHandler } from './createReqHandler';

const rabbitmqHost = process.env.RABBITMQ_HOST || "broker"
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest"
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest"
const port = process.env.PORT || 3000
// @ts-ignore
const connection = amqp.connect([`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`], { json: true });

connection.on('connect', ({ url }) => logger.verbose('Connected to %s', url, { action: 'connected', url }));
// @ts-ignore
connection.on('disconnect', params => logger.error('Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params }));

// Cast any to ChannelWrapper to get type-safetiness through our own code
const channelWrapperWebhooks: ChannelWrapper = connection.createChannel({
	setup: channel => {
		return Promise.all([
			channel.assertExchange('lagoon-webhooks', 'direct', { durable: true }),
		]);
	}
});

const handler = createReqHandler({ path: '/', channelWrapperWebhooks });

http.createServer((req, res) => {
  const { method, url, headers } = req;

	logger.verbose('New %s request to %s', method, url, {
    action: 'new-request',
    method,
    url,
    headers,
  });

	handler(req, res, logger, () => {
		res.statusCode = 404
		res.end('no such location')
	});
}).listen(port);
