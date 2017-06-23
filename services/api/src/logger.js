// @flow

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create the logs directory if it doesn't exist yet.
const directory = path.join('.', 'logs');
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory);
}

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
    new winston.transports.File({
      level: 'info',
      filename: path.join(directory, 'info.log'),
      name: 'info-file',
    }),
    new winston.transports.File({
      level: 'error',
      filename: path.join(directory, 'error.log'),
      name: 'error-file',
    }),
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
    }),
  ],
});

export const debug = logger.debug;

export default logger;

