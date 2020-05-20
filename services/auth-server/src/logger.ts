import winston from 'winston';

export const logger = new winston.Logger({
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
