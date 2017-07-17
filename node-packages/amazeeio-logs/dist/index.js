'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.sendToAmazeeioLogs = undefined;
exports.initSendToAmazeeioLogs = initSendToAmazeeioLogs;

var _amqpConnectionManager = require('amqp-connection-manager');

var _amqpConnectionManager2 = _interopRequireDefault(_amqpConnectionManager);

var _amazeeioLocalLogging = require('@amazeeio/amazeeio-local-logging');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _amazeeioLocalLogging.initLogger)();

var sendToAmazeeioLogs = exports.sendToAmazeeioLogs = function sendToAmazeeioLogs() {};
var rabbitmqHost = process.env.RABBITMQ_HOST || "rabbitmq";
var rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest";
var rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest";

function initSendToAmazeeioLogs() {
	var _this = this;

	var connection = _amqpConnectionManager2.default.connect(['amqp://' + rabbitmqUsername + ':' + rabbitmqPassword + '@' + rabbitmqHost], { json: true });

	connection.on('connect', function (_ref) {
		var url = _ref.url;
		return _amazeeioLocalLogging.logger.verbose('amazeeio-logs: Connected to %s', url, { action: 'connected', url: url });
	});
	connection.on('disconnect', function (params) {
		return _amazeeioLocalLogging.logger.error('amazeeio-logs: Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params });
	});

	// Cast any to ChannelWrapper to get type-safetiness through our own code
	var channelWrapper = connection.createChannel({
		setup: function setup(channel) {
			return Promise.all([channel.assertExchange('amazeeio-logs', 'direct', { durable: true })]);
		}
	});
	exports.sendToAmazeeioLogs = sendToAmazeeioLogs = function _callee(severity, sitegroup, uuid, event, meta, message) {
		var payload, buffer, packageName, options;
		return regeneratorRuntime.async(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						payload = { severity: severity, sitegroup: sitegroup, uuid: uuid, event: event, meta: meta, message: message };
						_context.prev = 1;
						buffer = new Buffer(JSON.stringify(payload));
						packageName = process.env.npm_package_name || "";
						options = {
							persistent: true,
							appId: packageName
						};
						_context.next = 7;
						return regeneratorRuntime.awrap(channelWrapper.publish('amazeeio-logs', '', buffer, options));

					case 7:

						_amazeeioLocalLogging.logger.log(severity, 'amazeeio-logs: Send to amazeeio-logs: ' + message);
						_context.next = 13;
						break;

					case 10:
						_context.prev = 10;
						_context.t0 = _context['catch'](1);

						_amazeeioLocalLogging.logger.error('amazeeio-logs: Error send to rabbitmq amazeeio-logs exchange, error: ' + _context.t0);

					case 13:
					case 'end':
						return _context.stop();
				}
			}
		}, null, _this, [[1, 10]]);
	};
}