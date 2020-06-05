const winston = require('winston');

const logger = new winston.Logger({
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
