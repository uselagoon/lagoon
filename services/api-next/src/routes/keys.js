// @flow

const logger = require('../logger');
const R = require('ramda');
const sshpk = require('sshpk');
const bodyParser = require('body-parser');

const getContext = require('../getContext');
const getCredentials = require('../getCredentials');

import type { $Request, $Response } from 'express';

const toFingerprint = (sshKey: string): string =>
  sshpk.parseKey(sshKey, 'ssh').fingerprint().toString();

const keysRoute = (req: $Request, res: $Response) => {
  const { fingerprint } = (req.body: any);

  if (!fingerprint) {
    return res.status(500).send('Missing parameter "fingerprint"');
  }

  logger.debug(`Accessing keys with fingerprint: ${fingerprint}`);

  const context = getContext(req);

  const credentials = getCredentials(req);

  const { getState } = context.store;
  const {
    getAllClients,
    getSshKeysFromClients,
    toSshKeyStr,
  } = context.selectors;

  const clients = getAllClients(getState());

  // Creates a fingerprint => sshKey mapping
  const fingerprintKeyMap = R.compose(
    R.fromPairs,
    R.map(sshKey => [toFingerprint(sshKey), sshKey]),
    R.map(toSshKeyStr),
    getSshKeysFromClients,
    R.filter(client => R.contains(client.clientName, credentials.clients))
  )(clients);

  const result = R.propOr('', fingerprint, fingerprintKeyMap);

  if (!result) {
    logger.debug(`Unknown fingerprint: ${fingerprint}`);
  }

  res.send(result);
};

module.exports = [bodyParser.json(), keysRoute];
