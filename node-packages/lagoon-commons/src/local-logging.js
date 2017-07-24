// @flow

const winston = require('winston');

exports.logger = undefined;

type Logger = typeof winston.Logger;

const identity: Logger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  verbose: () => {},
  debug: () => {},
  silly: () => {},
  log: () => {},
};

let logger: Logger = exports.logger = identity;

exports.logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: 'silly',
      'colorize': true,
      'timestamp': true
    }),
  ]
});


