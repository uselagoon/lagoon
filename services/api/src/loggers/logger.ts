const { addColors, createLogger, format, transports } = require('winston');
import { getConfigFromEnv } from '../util/config';
import { levels, colors } from '@lagoon/commons/dist/logs/';

addColors(colors);

export const logger = createLogger({
  exitOnError: false,
  levels,
  format: format.combine(
    format.colorize(),
    format.splat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] [${level}]: ${message}`
    )
  ),
  transports: [
    new transports.Console({
      level: getConfigFromEnv('CONSOLE_LOGGING_LEVEL', 'debug'),
      handleExceptions: true,
      json: false
    })
  ]
});
