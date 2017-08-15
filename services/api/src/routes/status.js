// @flow

const logger = require('../logger');

import type { $Request, $Response } from 'express';

const statusRoute = (req: $Request, res: $Response) => {
  logger.debug('Fetching status.');

  // @todo Add logic to fetch the status.
  const status = {};

  res.json({ status: 'success', data: status });
};

module.exports = [statusRoute];
