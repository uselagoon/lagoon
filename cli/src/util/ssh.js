// @flow

import os from 'os';
import path from 'path';
import url from 'url';
import inquirer from 'inquirer';
import R from 'ramda';
import { Client } from 'ssh2';
import { utils } from 'ssh2-streams';
import untildify from 'untildify';
import { config } from '../config';
import { printErrors } from '../printErrors';
import { fileExists, readFile } from './fs';

async function promptUntilValidKeyPath(
  cerr: typeof console.error,
): Promise<String> {
  const { privateKeyPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'privateKeyPath',
      message: 'Path to private key file',
      // TODO: Move the fileExists validation logic to this object under the validate key to fail earlier
    },
  ]);
  if (
    !await fileExists(
      // Expand tilde characters in paths
      untildify(privateKeyPath),
    )
  ) {
    printErrors(cerr, 'File does not exist at given path!');
    return promptUntilValidKeyPath(cerr);
  }
  return privateKeyPath;
}

export const getPrivateKeyPath = async ({
  identity,
}: {
  identity: ?string,
}): Promise<string> => {
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
    [R.T, async ({ cerr }) => promptUntilValidKeyPath(cerr)],
  ])(identity);
};

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

type Connection = {
  exec: (command: string, options?: Object, callback: Function) => Connection,
  on: (event: string, callback: Function) => Connection,
  end: () => Connection,
};

type ConnectConfig = {
  host: string,
  port: number,
  username: string,
  privateKey: string | Buffer,
  passphrase?: string,
};

export async function sshConnect({
  identity,
}: {
  identity: ?string,
}): Promise<Connection> {
  const connection = new Client();

  const privateKeyPath = await getPrivateKeyPath({ identity });
  const privateKey = await readFile(privateKeyPath);
  const passphrase = await getPrivateKeyPassphrase(
    utils.parseKey(privateKey).encryption,
  );

  let host = 'auth.amazee.io';
  let port = 2020;
  let username = 'api';

  const sshConfig = R.prop('endpoint', config);

  if (sshConfig) {
    const endpoint = url.parse(sshConfig);
    host = R.prop('hostname', endpoint);
    // url.parse() returns port as a string and .connect() accepts a number
    port = Number(R.prop('port', endpoint));
    username = R.prop('auth', endpoint);
  }

  const connectConfig: ConnectConfig = {
    host,
    port,
    username,
    privateKey,
    passphrase,
  };

  return new Promise((resolve, reject) => {
    connection.on('ready', () => {
      resolve(connection);
    });

    connection.on('error', (err) => {
      if (
        err.message.includes('All configured authentication methods failed')
      ) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return reject('SSH key not authorized.');
      }
      reject(err);
    });

    try {
      connection.connect(connectConfig);
    } catch (err) {
      // As of now, `ssh2-streams` has a dependency on `node-asn1`, which is
      // throwing obscure error messages when there are incorrect passphrases
      // for encrypted private keys.
      // Ref: https://github.com/mscdex/ssh2-streams/issues/76
      // Here we catch these errors and throw our own with messages that make
      // more sense.
      if (err.stack.includes('InvalidAsn1Error')) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject('Malformed private key. Bad passphrase?');
      }
      reject(err);
    }
  });
}

export async function sshExec(
  connection: Connection,
  command: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    connection.exec(command, {}, (error, stream) => {
      if (error) {
        reject(error);
      } else {
        stream.on('data', (data) => {
          resolve(data);
        });

        stream.stderr.on('data', (data) => {
          reject(new Error(data));
        });
      }
    });
  });
}
