import winston from 'winston';
require('winston-logstash');

export interface LogFn {
  (...args: any[]): void;
}

export interface Logger {
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
  verbose: LogFn;
  silly: LogFn;
  log: LogFn;
}

// const packageName = process.env.npm_package_name || '';

// @ts-ignore
export let logger = new winston.Logger({
  transports: [
    // @ts-ignore
    new winston.transports.Console({
      level: 'silly',
      colorize: true,
      timestamp: true,
      handleExceptions: true
    })
    // new winston.transports.Logstash({
    //   level: 'silly',
    //   port: 28777,
    //   host: 'logs2logs-db',
    //   timeout_connect_retries: 1000, // if we loose connection to logstash, retry in 1 sec
    //   max_connect_retries: 100000, // retry to connect to logstash for 100'000 times
    //   node_name: packageName,
    // }),
  ]
});

// @ts-ignore
logger.exitOnError = false;
