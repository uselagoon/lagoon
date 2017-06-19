// @flow

import sshpk from 'sshpk';

export function isKeyValid(key: string): boolean {
  try {
    // Validate the format of the ssh key. This fails with an exception
    // if the key is invalid. We are not actually interested in the
    // result of the parsing and just use this for validation.
    sshpk.parseKey(key, 'ssh');
    return true;
  } catch (e) {
    return false;
  }
}
