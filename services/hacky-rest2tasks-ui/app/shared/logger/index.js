// @flow

// Based on the current environment we export different loggers.
// Since we are using the uglify plugin for webpack, the dead code
// path (client side logging) is eliminated on production. Therefore,
// this will not affect the bundle size in production.

export default ((): Object => {
  if (__SERVER__) {
    return require('./server').default; // eslint-disable-line global-require
  }

  if (__CLIENT__ && __DEVELOPMENT__) {
    return require('./client').default; // eslint-disable-line global-require
  }

  // No logging on client side in production.
  const noop = () => {};

  return {
    log: noop,
    info: noop,
    debug: noop,
    warn: noop,
    error: noop,
  };
})();
