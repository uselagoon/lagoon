// @flow

const sshpk = require('sshpk');

const validateSshKey = (key /* : string */) /* : boolean */ => {
  // Validate the format of the ssh key. This fails with an exception
  // if the key is invalid. We are not actually interested in the
  // result of the parsing and just use this for validation.
  try {
    sshpk.parseKey(key, 'ssh');
    return true;
  } catch (e) {
    return false;
  }
};

const getSshKeyFingerprint = (key /* : string */) /* : string */ => {
  const parsed = sshpk.parseKey(key, 'ssh');
  return parsed.fingerprint('sha256', 'ssh').toString();
};

const generatePrivateKey = (type = 'ed25519') =>
  sshpk.generatePrivateKey(type);

module.exports = {
  validateSshKey,
  getSshKeyFingerprint,
  generatePrivateKey,
};
