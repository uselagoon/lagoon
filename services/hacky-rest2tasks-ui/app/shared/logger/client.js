// @flow

const profilers = [];

type Logger = {
  log: Function,
  info: (...args: Array<any>) => void,
  debug: (...args: Array<any>) => void,
  warn: (...args: Array<any>) => void,
  error: (...args: Array<any>) => void,
  profile?: (id: any) => void | Logger,
};

/* eslint-disable no-console */
const logger: Logger = {
  log: console.log,
  info: console.info || console.log,
  debug: console.debug || console.log,
  warn: console.warn || console.log,
  error: console.error || console.log,
};
/* eslint-enable no-console */

logger.profile = id => {
  const now = Date.now();

  if (profilers[id]) {
    const then = profilers[id];
    delete profilers[id];

    // Support variable arguments: msg, meta, callback.
    const args = Array.prototype.slice.call(arguments);
    const callback = typeof args[args.length - 1] === 'function'
      ? args.pop()
      : null;
    const meta = typeof args[args.length - 1] === 'object' ? args.pop() : {};
    const msg = args.length === 2 ? args[1] : id;

    // Set the duration property of the metadata.
    meta.durationMs = now - then;
    // eslint-disable-next-line no-console
    return logger.info(msg, meta, callback);
  }

  profilers[id] = now;

  return logger;
};

// Mocks the majority of the public methods of the winston logger.
export default logger;
