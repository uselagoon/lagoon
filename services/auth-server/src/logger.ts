const { addColors, createLogger, format, transports } = require('winston');

const getConfigFromEnv = (name: string, fallback: string = ''): string =>
  process.env[name] || fallback;

const levels = {
  fatal: 0, error: 1, warn: 2, info: 3, verbose: 4, debug: 5, trace: 6
};

const colors = {
  fatal: 'red', error: 'red', warn: 'yellow', info: 'magenta',
  verbose: 'white', debug: 'gray', trace: 'cyan'
};

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
      level: getConfigFromEnv('CONSOLE_LOGGING_LEVEL', 'info'),
      handleExceptions: true,
      json: false,
      colorize: true
    })
  ]
});
