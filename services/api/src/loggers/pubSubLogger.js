const { addColors, createLogger, format, transports } = require('winston');

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

addColors(config.colors);

const pubSubLogger = createLogger({
  exitOnError: false,
  levels: config.levels,
  format: format.combine(
    format.colorize(),
    format.splat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => {
      let message;
      if (info.message !== undefined) {
        message = info.message;
      }
      let level = info.level ? `pubsub-${info.level}` : 'pubsub';
      return `[${info.timestamp}] [${level}]: ${message}`;
    }),
  ),
  transports: [
    new transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
    }),
  ],
});

module.exports = pubSubLogger;
