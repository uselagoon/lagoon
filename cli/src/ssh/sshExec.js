// @flow

import execa from 'execa';
import R from 'ramda';
import { getSshConfig } from '../config/getSshConfig';

export async function sshExec({
  command,
  identity,
}: {
  command: string,
  identity: string,
}): Promise<string | null> {
  const { username, host, port } = getSshConfig();

  // TODO: Consider reading the password and passing it along to the `ssh` command using something like node-pty (needed because ssh reads directly from tty https://github.com/nodejs/node-v0.x-archive/issues/1157#issuecomment-7339123). This would allow you to maintain a more consistent design + user experience.
  let output = {};

  try {
    output = await execa('ssh', [
      '-p',
      String(port),
      '-i',
      identity,
      // Ignore any ssh configuration changed by the user
      // https://man.openbsd.org/ssh#F
      '-F',
      '/dev/null',
      // Don't add this key to the ssh-agent automatically (may be default)
      '-o',
      'AddKeysToAgent=no',
      // Ignore any keys that have already been added to the ssh-agent
      '-o',
      'IdentitiesOnly=yes',
      `${username}@${host}`,
      command,
    ]);
  } catch (err) {
    // Only throw first line of error
    throw R.compose(
      R.head,
      R.split('\n'),
      R.prop('stderr'),
    )(err);
  }

  return R.propOr(null, 'stdout')(output);
}
