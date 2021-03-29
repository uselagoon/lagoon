const winston = require('winston');

const config = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    trace: 5
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'magenta',
    verbose: 'white',
    debug: 'gray',
    trace: 'cyan',
  }
};

winston.addColors(config.colors);

const logger = winston.createLogger({
  exitOnError: false,
  levels: config.levels,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console({
      level: 'trace',
      handleExceptions: true,
      json: false,
    }),
  ],
});

module.exports = logger;
