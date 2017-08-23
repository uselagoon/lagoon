// @flow

const logger = require('../logger');
const R = require('ramda');

const getContext = require('../getContext');
const getCredentials = require('../getCredentials');

import type { $Request, $Response } from 'express';

const keysAccessMiddleware = (
  req: $Request,
  res: $Response,
  next: Function
) => {
  // TODO:
  // This should restrict access for all requests except those
  // from the local network (from the ssh agent service).
  next();
};

const keysRoute = (req: $Request, res: $Response) => {
  logger.debug('Collecting client keys.');

  const context = getContext(req);

  const credentials = getCredentials(req);

  const { getState } = context.store;
  const {
    getAllClients,
    getSshKeysFromClients,
    toSshKeyStr,
  } = context.selectors;

  const clients = getAllClients(getState());

  const result = R.compose(
    R.join('\n'),
    R.map(toSshKeyStr),
    getSshKeysFromClients,
    R.filter(client => R.contains(client.clientName, credentials.clients))
  )(clients);

  res.send(result);
};

module.exports = [keysAccessMiddleware, keysRoute];
