// @flow

const winston = require('winston');
const path = require('path');
const fs = require('fs');

/* ::

export type LogFn = (...args: Array<any>) => void;

export type Logger = {
  info: LogFn,
  debug: LogFn,
  error: LogFn,
};
*/
const logger: Logger = new winston.Logger({
  exitOnError: false,
  transports: [
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
    }),
  ],
});

module.exports = logger;
