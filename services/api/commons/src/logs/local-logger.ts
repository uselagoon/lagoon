const { addColors, createLogger, format, transports } = require('winston');
import { getConfigFromEnv } from '../util/config';
import { levels, colors } from './';

export interface LogFn {
  (...args: any[]): void;
}

export interface Logger {
  fatal: LogFn;
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  verbose: LogFn;
  debug: LogFn;
  trace: LogFn;
  log: LogFn;
}

addColors(colors);

export const logger = createLogger({
  exitOnError: false,
  levels,
  format: format.combine(
    format.colorize(),
    format.splat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(
      ({
        timestamp,
        level,
        message,
      }: {
        timestamp: string;
        level: string;
        message: string;
      }) => `[${timestamp}] [${level}]: ${message}`,
    ),
  ),
  transports: [
    new transports.Console({
      level: getConfigFromEnv('CONSOLE_LOGGING_LEVEL', 'info'),
      colorize: true,
      timestamp: true,
      handleExceptions: true,
    }),
  ],
});
