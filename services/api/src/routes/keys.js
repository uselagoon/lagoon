// @flow

const logger = require('../logger');
const R = require('ramda');
const sshpk = require('sshpk');
const bodyParser = require('body-parser');
const { getCustomerSshKeys } = require('../resources/sshKey/resolvers');

const toFingerprint = sshKey => {
  try {
    return sshpk
      .parseKey(sshKey, 'ssh')
      .fingerprint()
      .toString();
  } catch (e) {
    logger.error(`Invalid ssh key: ${sshKey}`);
  }
};

const keysRoute = async (
  { body: { fingerprint }, credentials: { role } } /* : Object */,
  res /* : Object */,
) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (!fingerprint) {
    return res.status(500).send('Missing parameter "fingerprint"');
  }

  logger.debug(`Accessing keys with fingerprint: ${fingerprint}`);

  const sshKeys = await getCustomerSshKeys(
    // $FlowFixMe
    {},
    // $FlowFixMe
    {},
    // $FlowFixMe
    { credentials: { role } },
  );

  // Object of fingerprints mapping to SSH keys
  // Ex. { <fingerprint>: <key> }
  const fingerprintKeyMap = R.compose(
    // Transform back to object from pairs
    R.fromPairs,
    // Remove undefined fingerprints
    R.reject(([sshKeyFingerprint]) => sshKeyFingerprint === undefined),
    // Transform from single-level array to array of pairs, with the SSH key fingerprint as the first value
    R.map(sshKey => [toFingerprint(sshKey), sshKey]),
  )(sshKeys);

  const result = R.propOr('', fingerprint, fingerprintKeyMap);

  if (!result) {
    logger.debug(`Unknown fingerprint: ${fingerprint}`);
  }

  res.send(result);
};

module.exports = [bodyParser.json(), keysRoute];
