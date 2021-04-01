const winston = require('winston');
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

const config = {
  levels: {
    error: 0,
    debug: 1,
    warn: 2,
    data: 3,
    info: 4,
    verbose: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    debug: 'blue',
    warn: 'yellow',
    data: 'grey',
    info: 'green',
    verbose: 'cyan',
    silly: 'magenta'
  }
};

// @ts-ignore
winston.addColors(config.colors);

export const logger = winston.createLogger({
  exitOnError: false,
  levels: config.levels,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
  ),
  transports: [
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