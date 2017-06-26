// @flow

import logger from '../logger';
import type { $Request, $Response } from 'express';

export default (req: $Request, res: $Response) => {
  logger.debug('Fetching status.');

  // @todo Add logic to fetch the status.
  const status = {};

  res.json({ status: 'success', data: status });
};
