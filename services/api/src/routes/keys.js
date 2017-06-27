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

const myKey = 'AAAAB3NzaC1yc2EAAAADAQABAAABAQC8ZPUnNvODhzt7SE6/SsYQj/1rsibY+UhPpNWR28PqspRkEXeALol/pYs3wYW/DFyqPt2O9KiB4rmsQknDyZEREPmX06L7/nXgE6aC6LKHW6HPeFp+xOK5+MQrBDZpnax8hQl8O4BwyZM/cLdYjdRD/k1uHi/A6dBlFDM25zNJgl1sX5omuOow+YwM/rgANHPANHhMczGRBvIhVl9fetjamnucWs1LBdUjU26hI8ji6ubFQ9MnFUdzwOQ3mI3v2V5bzz+956DwQ0aUoIDLTa3o23DsfmxSyZMdGvSlzn2V37Lj4qyxxW6JR88EQlpHWLeQBl9wvtoSNB0aYRCTI92j';

const getSshKeysFromClient = R.compose(
  R.map(([id, value]) => `${value.type || 'ssh-rsa'} ${value.key}`),
  Object.entries,
  // R.filter(({ key }) => key === myKey),
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
  res.send(keys.join("\n"));
};
