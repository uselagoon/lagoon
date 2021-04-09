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


export const logger = createLogger({
  exitOnError: false,
  levels: config.levels,
  format: format.combine(
    format.colorize(),
    format.splat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => {
      let message, meta;
      if (info.message !== undefined) {
        message = info.message;
      }
      let level = info.level ? info.level : 'INFO';
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
