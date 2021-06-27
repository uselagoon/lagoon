const winston = require('winston');

export const logger = winston.createLogger({
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
