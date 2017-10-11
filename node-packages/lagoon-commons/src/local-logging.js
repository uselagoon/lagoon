// @flow

const winston = require('winston');

/* ::

export type LogFn = (...args: Array<any>) => void;

export type Logger = {
  error: LogFn,
  warn: LogFn,
  info: LogFn,
  debug: LogFn,
  error: LogFn,
  verbose: LogFn,
  silly: LogFn,
  log: LogFn,
};

*/

const identity: Logger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  verbose: () => {},
  debug: () => {},
  silly: () => {},
  log: () => {},
};

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: 'silly',
      'colorize': true,
      'timestamp': true
    }),
  ]
});

exports.logger = logger;
