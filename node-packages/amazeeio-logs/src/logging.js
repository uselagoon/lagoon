// @flow

import winston from 'winston';

export type Logger = typeof winston.Logger;

const identity: Logger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  verbose: () => {},
  debug: () => {},
  silly: () => {},
};

export let logger: Logger = identity;

export function initLogger() {
  logger = new winston.Logger({
    transports: [
      new winston.transports.Console({
        level: 'silly',
        'colorize': true,
        'timestamp': true
      }),
    ]
  });
}
