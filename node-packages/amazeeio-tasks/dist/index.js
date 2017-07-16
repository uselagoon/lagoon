'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.NoNeedToDeployBranch = exports.UnknownActiveSystem = exports.connection = exports.sendToAmazeeioTasks = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.initSendToAmazeeioTasks = initSendToAmazeeioTasks;
exports.createDeployTask = createDeployTask;
exports.createRemoveTask = createRemoveTask;
exports.consumeTasks = consumeTasks;

var _amqpConnectionManager = require('amqp-connection-manager');

var _amqpConnectionManager2 = _interopRequireDefault(_amqpConnectionManager);

var _amazeeioLocalLogging = require('@amazeeio/amazeeio-local-logging');

var _amazeeioApi = require('@amazeeio/amazeeio-api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var sendToAmazeeioTasks = exports.sendToAmazeeioTasks = function sendToAmazeeioTasks() {};
var connection = exports.connection = function connection() {};
var rabbitmqHost = process.env.RABBITMQ_HOST || "localhost";
var rabbitmqUsername = process.env.RABBITMQ_USERNAME || "guest";
var rabbitmqPassword = process.env.RABBITMQ_PASSWORD || "guest";

(0, _amazeeioLocalLogging.initLogger)();

var UnknownActiveSystem = exports.UnknownActiveSystem = function (_Error) {
	_inherits(UnknownActiveSystem, _Error);

	function UnknownActiveSystem(message) {
		_classCallCheck(this, UnknownActiveSystem);

		var _this = _possibleConstructorReturn(this, (UnknownActiveSystem.__proto__ || Object.getPrototypeOf(UnknownActiveSystem)).call(this, message));

		_this.name = 'UnknownActiveSystem';
		return _this;
	}

	return UnknownActiveSystem;
}(Error);

var NoNeedToDeployBranch = exports.NoNeedToDeployBranch = function (_Error2) {
	_inherits(NoNeedToDeployBranch, _Error2);

	function NoNeedToDeployBranch(message) {
		_classCallCheck(this, NoNeedToDeployBranch);

		var _this2 = _possibleConstructorReturn(this, (NoNeedToDeployBranch.__proto__ || Object.getPrototypeOf(NoNeedToDeployBranch)).call(this, message));

		_this2.name = 'NoNeedToDeployBranch';
		return _this2;
	}

	return NoNeedToDeployBranch;
}(Error);

function initSendToAmazeeioTasks() {
	var _this3 = this;

	exports.connection = connection = _amqpConnectionManager2.default.connect(['amqp://' + rabbitmqUsername + ':' + rabbitmqPassword + '@' + rabbitmqHost], { json: true });

	connection.on('connect', function (_ref) {
		var url = _ref.url;
		return _amazeeioLocalLogging.logger.verbose('amazeeio-tasks: Connected to %s', url, { action: 'connected', url: url });
	});
	connection.on('disconnect', function (params) {
		return _amazeeioLocalLogging.logger.error('amazeeio-tasks: Not connected, error: %s', params.err.code, { action: 'disconnected', reason: params });
	});

	var channelWrapper = connection.createChannel({
		setup: function setup(channel) {
			return Promise.all([

			// Our main Exchange for all amazeeio-tasks
			channel.assertExchange('amazeeio-tasks', 'direct', { durable: true }), channel.assertExchange('amazeeio-tasks-delay', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'fanout' } }), channel.bindExchange('amazeeio-tasks', 'amazeeio-tasks-delay', '')]);
		}
	});

	exports.sendToAmazeeioTasks = sendToAmazeeioTasks = function _callee(task, payload) {
		var buffer;
		return regeneratorRuntime.async(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						_context.prev = 0;
						buffer = new Buffer(JSON.stringify(payload));
						_context.next = 4;
						return regeneratorRuntime.awrap(channelWrapper.publish('amazeeio-tasks', task, buffer, { persistent: true }));

					case 4:
						_amazeeioLocalLogging.logger.debug('amazeeio-tasks: Successfully created task \'' + task + '\'', payload);
						return _context.abrupt('return', 'amazeeio-tasks: Successfully created task \'' + task + '\': ' + JSON.stringify(payload));

					case 8:
						_context.prev = 8;
						_context.t0 = _context['catch'](0);

						_amazeeioLocalLogging.logger.error('amazeeio-tasks: Error send to amazeeio-task exchange', {
							payload: payload,
							error: _context.t0
						});
						throw _context.t0;

					case 12:
					case 'end':
						return _context.stop();
				}
			}
		}, null, _this3, [[0, 8]]);
	};
}

function createDeployTask(deployData) {
	var siteGroupName, branchName, sha, type, activeSystems, activeSystem, activeDeploySystem, legacyDeploySystemConfig, branchRegex, deploySystemConfig, _branchRegex;

	return regeneratorRuntime.async(function createDeployTask$(_context2) {
		while (1) {
			switch (_context2.prev = _context2.next) {
				case 0:
					siteGroupName = deployData.siteGroupName, branchName = deployData.branchName, sha = deployData.sha, type = deployData.type;
					_context2.next = 3;
					return regeneratorRuntime.awrap((0, _amazeeioApi.getActiveSystemsForSiteGroup)(siteGroupName));

				case 3:
					activeSystems = _context2.sent;

					if (!(typeof activeSystems.deploy === 'undefined')) {
						_context2.next = 6;
						break;
					}

					throw new UnknownActiveSystem('No active system for tasks \'deploy\' in for sitegroup ' + siteGroupName);

				case 6:

					// BC: the given active Systems were just a string in the past, now they are an object with the active system as a key
					if (typeof activeSystems.deploy === 'string') {
						activeSystem = activeSystems.deploy;

						activeSystems.deploy = {};
						activeSystems.deploy[activeSystem] = {};
					}

					// We only check the first given System, we could also allow multiple, but it's better to just create another sitegroup with the same gitURL
					activeDeploySystem = Object.keys(activeSystems.deploy)[0];
					_context2.t0 = activeDeploySystem;
					_context2.next = _context2.t0 === 'lagoon_openshift' ? 11 : _context2.t0 === 'lagoon_openshiftLegacy' ? 11 : _context2.t0 === 'lagoon_openshiftDeploy' ? 31 : 51;
					break;

				case 11:
					// this is the old legacy system which does not create projects
					legacyDeploySystemConfig = activeSystems.deploy['lagoon_openshift'];

					if (!(type === 'branch')) {
						_context2.next = 31;
						break;
					}

					_context2.t1 = legacyDeploySystemConfig.branches;
					_context2.next = _context2.t1 === undefined ? 16 : _context2.t1 === true ? 18 : _context2.t1 === false ? 20 : 22;
					break;

				case 16:
					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', no branches defined in active system, assuming we want all of them');
					return _context2.abrupt('return', sendToAmazeeioTasks('deploy-openshift-legacy', deployData));

				case 18:
					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', all branches active, therefore deploying');
					return _context2.abrupt('return', sendToAmazeeioTasks('deploy-openshift-legacy', deployData));

				case 20:
					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', branch deployments disabled');
					throw new NoNeedToDeployBranch('Branch deployments disabled');

				case 22:
					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', regex ' + legacyDeploySystemConfig.branches + ', testing if it matches');
					branchRegex = new RegExp(legacyDeploySystemConfig.branches);

					if (!branchRegex.test(branchName)) {
						_context2.next = 29;
						break;
					}

					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', regex ' + legacyDeploySystemConfig.branches + ' matched branchname, starting deploy');
					return _context2.abrupt('return', sendToAmazeeioTasks('deploy-openshift-legacy', deployData));

				case 29:
					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', regex ' + legacyDeploySystemConfig.branches + ' did not match branchname, not deploying');
					throw new NoNeedToDeployBranch('configured regex \'' + legacyDeploySystemConfig.branches + '\' does not match branchname \'' + branchName + '\'');

				case 31:
					deploySystemConfig = activeSystems.deploy['lagoon_openshiftDeploy'];

					if (!(type === 'branch')) {
						_context2.next = 51;
						break;
					}

					_context2.t2 = deploySystemConfig.branches;
					_context2.next = _context2.t2 === undefined ? 36 : _context2.t2 === true ? 38 : _context2.t2 === false ? 40 : 42;
					break;

				case 36:
					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', no branches defined in active system, assuming we want all of them');
					return _context2.abrupt('return', sendToAmazeeioTasks('deploy-openshift', deployData));

				case 38:
					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', all branches active, therefore deploying');
					return _context2.abrupt('return', sendToAmazeeioTasks('deploy-openshift', deployData));

				case 40:
					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', branch deployments disabled');
					throw new NoNeedToDeployBranch('Branch deployments disabled');

				case 42:
					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', regex ' + deploySystemConfig.branches + ', testing if it matches');
					_branchRegex = new RegExp(deploySystemConfig.branches);

					if (!_branchRegex.test(branchName)) {
						_context2.next = 49;
						break;
					}

					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', regex ' + deploySystemConfig.branches + ' matched branchname, starting deploy');
					return _context2.abrupt('return', sendToAmazeeioTasks('deploy-openshift', deployData));

				case 49:
					_amazeeioLocalLogging.logger.debug('siteGroupName: ' + siteGroupName + ', branchName: ' + branchName + ', regex ' + deploySystemConfig.branches + ' did not match branchname, not deploying');
					throw new NoNeedToDeployBranch('configured regex \'' + deploySystemConfig.branches + '\' does not match branchname \'' + branchName + '\'');

				case 51:
					throw new UnknownActiveSystem('Unknown active system \'' + activeDeploySystem + '\' for task \'deploy\' in for sitegroup ' + siteGroupName);

				case 52:
				case 'end':
					return _context2.stop();
			}
		}
	}, null, this);
}

function createRemoveTask(removeData) {
	var siteGroupName, openshiftRessourceAppName, activeSystems, activeSystem, activeRemoveSystem;
	return regeneratorRuntime.async(function createRemoveTask$(_context3) {
		while (1) {
			switch (_context3.prev = _context3.next) {
				case 0:
					siteGroupName = removeData.siteGroupName, openshiftRessourceAppName = removeData.openshiftRessourceAppName;
					_context3.next = 3;
					return regeneratorRuntime.awrap((0, _amazeeioApi.getActiveSystemsForSiteGroup)(siteGroupName));

				case 3:
					activeSystems = _context3.sent;

					if (!(typeof activeSystems.remove === 'undefined')) {
						_context3.next = 6;
						break;
					}

					throw new UnknownActiveSystem('No active system for tasks \'deploy\' in for sitegroup ' + siteGroupName);

				case 6:

					// BC: the given active Systems were just a string in the past, now they are an object with the active system as a key
					if (typeof activeSystems.remove === 'string') {
						activeSystem = activeSystems.remove;

						activeSystems.remove = {};
						activeSystems.remove[activeSystem] = {};
					}

					// We only check the first given System, we could also allow multiple, but it's better to just create another sitegroup with the same gitURL
					activeRemoveSystem = Object.keys(activeSystems.remove)[0];
					_context3.t0 = activeRemoveSystem;
					_context3.next = _context3.t0 === 'lagoon_openshiftLegacy' ? 11 : _context3.t0 === 'lagoon_openshift' ? 11 : _context3.t0 === 'lagoon_openshiftRemove' ? 12 : 13;
					break;

				case 11:
					return _context3.abrupt('return', sendToAmazeeioTasks('remove-openshift-resources-legacy', removeData));

				case 12:
					return _context3.abrupt('return', sendToAmazeeioTasks('remove-openshift-resources', removeData));

				case 13:
					throw new UnknownActiveSystem('Unknown active system \'' + activeRemoveSystem + '\' for task \'remove\' in for sitegroup ' + siteGroupName);

				case 14:
				case 'end':
					return _context3.stop();
			}
		}
	}, null, this);
}

function consumeTasks(taskQueueName, messageConsumer, retryHandler, deathHandler) {
	var _this4 = this;

	var onMessage, channelWrapper;
	return regeneratorRuntime.async(function consumeTasks$(_context5) {
		while (1) {
			switch (_context5.prev = _context5.next) {
				case 0:
					onMessage = function _callee2(msg) {
						var retryCount, retryDelaySecs, retryDelayMilisecs, retryMsgOptions;
						return regeneratorRuntime.async(function _callee2$(_context4) {
							while (1) {
								switch (_context4.prev = _context4.next) {
									case 0:
										_context4.prev = 0;
										_context4.next = 3;
										return regeneratorRuntime.awrap(messageConsumer(msg));

									case 3:
										channelWrapper.ack(msg);
										_context4.next = 19;
										break;

									case 6:
										_context4.prev = 6;
										_context4.t0 = _context4['catch'](0);

										// We land here if the messageConsumer has an error that it did not itslef handle.
										// This is how the consumer informs us that we it would like to retry the message in a couple of seconds

										retryCount = msg.properties.headers["x-retry"] ? msg.properties.headers["x-retry"] + 1 : 1;

										if (!(retryCount > 3)) {
											_context4.next = 13;
											break;
										}

										channelWrapper.ack(msg);
										deathHandler(msg, _context4.t0);
										return _context4.abrupt('return');

									case 13:
										retryDelaySecs = Math.pow(10, retryCount);
										retryDelayMilisecs = retryDelaySecs * 1000;


										try {
											retryHandler(msg, _context4.t0, failCount, retryDelaySecs);
										} catch (error) {}
										// intentionally empty as we don't want to fail and not requeue our message just becase the retryHandler fails


										// copying options from the original message
										retryMsgOptions = {
											appId: msg.properties.appId,
											timestamp: msg.properties.timestamp,
											contentType: msg.properties.contentType,
											deliveryMode: msg.properties.deliveryMode,
											headers: _extends({}, msg.properties.headers, { 'x-delay': retryDelayMilisecs, 'x-retry': retryCount }),
											persistent: true
										};

										// publishing a new message with the same content as the original message but into the `amazeeio-tasks-delay` exchange,
										// which will send the message into the original exchange `amazeeio-tasks` after waiting the x-delay time.

										channelWrapper.publish('amazeeio-tasks-delay', msg.fields.routingKey, msg.content, retryMsgOptions

										// acknologing the existing message, we cloned it and is not necessary anymore
										);channelWrapper.ack(msg);

									case 19:
									case 'end':
										return _context4.stop();
								}
							}
						}, null, _this4, [[0, 6]]);
					};

					channelWrapper = connection.createChannel({
						setup: function setup(channel) {
							return Promise.all([channel.assertQueue('amazeeio-tasks:' + taskQueueName, { durable: true }), channel.bindQueue('amazeeio-tasks:' + taskQueueName, 'amazeeio-tasks', taskQueueName), channel.prefetch(2), channel.consume('amazeeio-tasks:' + taskQueueName, onMessage, { noAck: false })]);
						}
					});

				case 2:
				case 'end':
					return _context5.stop();
			}
		}
	}, null, this);
}