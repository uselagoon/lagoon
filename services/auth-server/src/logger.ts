const winston = require('winston');
import { getConfigFromEnv } from '@lagoon/commons/dist/util/config'

export const logger = winston.createLogger({
  exitOnError: false,
  transports: [
    new winston.transports.Console({
      level: getConfigFromEnv('CONSOLE_LOGGING_LEVEL', 'debug'),
      handleExceptions: true,
      json: false,
      colorize: true,
    }),
  ],
});
