'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logger = undefined;
exports.initLogger = initLogger;

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var identity = {
  error: function error() {},
  warn: function warn() {},
  info: function info() {},
  verbose: function verbose() {},
  debug: function debug() {},
  silly: function silly() {},
  log: function log() {}
};

var logger = exports.logger = identity;

function initLogger() {
  exports.logger = logger = new _winston2.default.Logger({
    transports: [new _winston2.default.transports.Console({
      level: 'silly',
      'colorize': true,
      'timestamp': true
    })]
  });
}