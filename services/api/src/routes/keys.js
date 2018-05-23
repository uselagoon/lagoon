// @flow

const logger = require('../logger');
const R = require('ramda');
const sshpk = require('sshpk');
const bodyParser = require('body-parser');

const toFingerprint = (sshKey) => {
  try {
    return sshpk
      .parseKey(sshKey, 'ssh')
      .fingerprint()
      .toString();
  } catch (e) {
    logger.error(`Invalid ssh key detected: ${sshKey}`);
  }
};

const keysRoute = async (req /* : Object */, res /* : Object */) => {
  const { fingerprint } = req.body;
  const cred = req.credentials;

  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (!fingerprint) {
    return res.status(500).send('Missing parameter "fingerprint"');
  }

  const dao = req.app.get('context').dao;

  logger.debug(`Accessing keys with fingerprint: ${fingerprint}`);

  const sshKeys = await dao.getCustomerSshKeys(cred);

  const fingerprintKeyMap = R.compose(
    R.fromPairs,
    R.reject(([sshKeyFingerprint]) => sshKeyFingerprint === undefined),
    R.map(sshKey => [toFingerprint(sshKey), sshKey]),
  )(sshKeys);

  const result = R.propOr('', fingerprint, fingerprintKeyMap);

  if (!result) {
    logger.debug(`Unknown fingerprint: ${fingerprint}`);
  }

  res.send(result);
};

module.exports = [bodyParser.json(), keysRoute];
