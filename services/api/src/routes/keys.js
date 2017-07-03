// @flow

import logger from '../logger';

import { getContext } from '../app';

import type { $Request, $Response } from 'express';

const keysAccessMiddleware = (
  req: $Request,
  res: $Response,
  next: Function,
) => {
  // TODO:
  // This should restrict access for all requests except those
  // from the local network (from the ssh agent service).
  next();
};

const keysRoute = (req: $Request, res: $Response) => {
  logger.debug('Collecting client keys.');

  const context = getContext(req);

  const { getState } = context.store;
  const { getAllClients, getSshKeysFromClients } = context.selectors;

  const clients = getAllClients(getState());
  const keys = getSshKeysFromClients(clients);
  res.send(keys.join('\n'));
};

export default [keysAccessMiddleware, keysRoute];
