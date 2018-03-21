// @flow

const logger = require('../logger');

const statusRoute = (req /* : Object */, res /* : Object */) => {
  logger.debug('Fetching status.');

  // @todo Add logic to fetch the status.
  const status = {};

  res.json({ status: 'success', data: status });
};

module.exports = [statusRoute];
