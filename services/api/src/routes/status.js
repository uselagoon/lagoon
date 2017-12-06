// @flow

const logger = require('../logger');

const statusRoute = (req, res) => {
  logger.debug('Fetching status.');

  // @todo Add logic to fetch the status.
  const status = {};

  res.json({ status: 'success', data: status });
};

module.exports = [statusRoute];
