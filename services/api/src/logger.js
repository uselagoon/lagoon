const { addColors, createLogger, format, transports } = require('winston');

const config = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,
    trace: 6
  },
  colors: {
    fatal: 'red',
    error: 'red',
    warn: 'yellow',
    info: 'magenta',
    verbose: 'white',
    debug: 'gray',
    trace: 'cyan',
  }
};

addColors(config.colors);

const logger = createLogger({
  exitOnError: false,
  levels: config.levels,
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
    }),
  ],
});

module.exports = logger;
