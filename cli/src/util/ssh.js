// @flow

import inquirer from 'inquirer';
import R from 'ramda';
import { Client } from 'ssh2';
import untildify from 'untildify';
import { fileExists } from '../util/fs';
import { printErrors } from '../printErrors';

type ExecOptions = {};

type Connection = {
  exec: (
    command: string,
    options?: ExecOptions,
    callback: Function,
  ) => Connection,
  on: (event: string, callback: Function) => Connection,
  end: () => Connection,
};

type ConnectArgs = {
  host: string,
  port: number,
  username: string,
  privateKey: string | Buffer,
  passphrase?: string,
};

export async function sshConnect(args: ConnectArgs): Promise<Connection> {
  return new Promise((resolve, reject) => {
    const connection = new Client();

    connection.on('ready', () => {
      resolve(connection);
    });

    connection.on('error', (err) => {
      if (
        err.message.includes('All configured authentication methods failed')
      ) {
        return reject('SSH key not authorized.');
      }
      reject(err);
    });

    try {
      connection.connect(args);
    } catch (err) {
      // As of now, `ssh2-streams` has a dependency on `node-asn1`, which is
      // throwing obscure error messages when there are incorrect passphrases
      // for encrypted private keys.
      // Ref: https://github.com/mscdex/ssh2-streams/issues/76
      // Here we catch these errors and throw our own with messages that make
      // more sense.
      if (err.stack.includes('InvalidAsn1Error')) {
        reject('Malformed private key. Bad passphrase?');
      }
      reject(err);
    }
  });
}

export async function sshExec(
  connection: Connection,
  command: string,
  options?: ExecOptions = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    connection.exec(command, options, (error, stream) => {
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

async function promptUntilValidPath(
  cerr: typeof console.error,
): Promise<String> {
  const { privateKeyPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'privateKeyPath',
      message: 'Path to private key file',
    },
  ]);
  if (!await fileExists(untildify(privateKeyPath))) {
    printErrors(cerr, 'File does not exist at given path!');
    return promptUntilValidPath(cerr);
  }
  return privateKeyPath;
}

type GetPrivateKeyPathArgs = {
  fileExistsAtDefaultPath: boolean,
  defaultPrivateKeyPath: string,
  identityOption?: string,
  cerr: typeof console.error,
};

export const getPrivateKeyPath = async (
  args: GetPrivateKeyPathArgs,
): Promise<string> =>
  R.cond([
    // If the identity option for the command has been specified and the file at the path exists, use the value of that
    [
      R.propSatisfies(
        // Option is not null or undefined
        R.complement(R.isNil),
        'identityOption',
      ),
      R.prop('identityOption'),
    ],
    // If a file exists at the default private key path, use that
    [R.prop('fileExistsAtDefaultPath'), R.prop('defaultPrivateKeyPath')],
    // If none of the previous conditions have been satisfied, ask the user if they want to overwrite the file
    [R.T, async ({ cerr }) => promptUntilValidPath(cerr)],
  ])(args);

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
