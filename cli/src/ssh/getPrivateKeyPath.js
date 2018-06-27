// @flow

import os from 'os';
import path from 'path';
import R from 'ramda';
import untildify from 'untildify';
import { promptUntilValidKeyPath } from '../cli/promptUntilValidKeyPath';
import { fileExists } from '../util/fs';

type GetPrivateKeyPathArgs = {
  identity: ?string,
  cerr: typeof console.error,
};

export const getPrivateKeyPath = async ({
  identity,
  cerr,
}:
GetPrivateKeyPathArgs): Promise<string> => {
  const defaultPrivateKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');

  return R.cond([
    // If the identity option for the command has been specified, use the value of that (passed through untildify)
    [
      // Option is not null or undefined
      R.complement(R.isNil),
      // Expand tilde characters in paths
      untildify,
    ],
    // If a file exists at the default private key path, use that
    [
      R.always(await fileExists(defaultPrivateKeyPath)),
      R.always(defaultPrivateKeyPath),
    ],
    // If none of the previous conditions have been satisfied, prompt the user until they provide a valid path to an existing file
    [R.T, async () => promptUntilValidKeyPath(cerr)],
  ])(identity);
};
