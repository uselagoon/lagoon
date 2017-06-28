// @flow

import R from 'ramda';
import logger from '../logger';

import type { $Request, $Response } from 'express';

export const keysAccessMiddleware = (
  req: $Request,
  res: $Response,
  next: Function,
) => {
  // TODO:
  // This should restrict access for all requests except those
  // from the local network (from the ssh agent service).
  next();
};

const getSshKeysFromClient = R.compose(
  R.map((value) => `${value.type || 'ssh-rsa'} ${value.key}`),
  R.values,
  R.propOr({}, 'ssh_keys'),
);

const getSshKeysFromClients = R.compose(
  R.apply(R.concat),
  R.map(getSshKeysFromClient),
);

export default async (req: $Request, res: $Response) => {
  logger.debug('Collecting client keys.');

  const { getState } = req.context;
  const { getAllClients } = req.context.selectors;

  const clients = getAllClients(getState());
  const keys = getSshKeysFromClients(clients);

  res.set('Content-Type', 'text/plain; charset=UTF-8');
  res.send(keys.join('\n'));
};
