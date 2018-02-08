// @flow

const winston = require('winston');
require('winston-logstash');
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

const packageName = process.env.npm_package_name || ""

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: 'silly',
      'colorize': true,
      'timestamp': true,
      handleExceptions: true
    }),
    new winston.transports.Logstash({
      level: 'silly',
      port: 28777,
      host: 'logs2logs-db',
      timeout_connect_retries: 1000, // if we loose connection to logstash, retry in 1 sec
      max_connect_retries: 100000, // retry to connect to logstash for 100'000 times
      node_name: packageName
    })
  ]
});

logger.exitOnError = false;

exports.logger = logger;
