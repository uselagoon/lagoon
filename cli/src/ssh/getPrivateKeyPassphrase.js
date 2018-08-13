// @flow

import inquirer from 'inquirer';
import R from 'ramda';

export const getPrivateKeyPassphrase = async (
  privateKeyHasEncryption: boolean,
): Promise<string> =>
  R.ifElse(
    // If the private key doesn't have encryption...
    R.not,
    // ... return an empty string
    R.always(''),
    // If the private key has encryption, ask for the passphrase
    async () => {
      const { passphrase } = await inquirer.prompt([
        {
          type: 'password',
          name: 'passphrase',
          message: 'Private key passphrase (never saved)',
          default: '',
        },
      ]);
      return passphrase;
    },
  )(privateKeyHasEncryption);
