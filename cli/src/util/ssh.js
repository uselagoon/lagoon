// @flow

import inquirer from 'inquirer';
import R from 'ramda';
import { Client } from 'ssh2';
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

    connection.on('error', (error) => {
      reject(error);
    });

    connection.connect(args);
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
    [
      R.T,
      async ({ cerr }) => {
        // TODO: Do now.
        // TODO: Ramdaify / FPify?
        let privateKeyPath = '';
        let privateKeyExists = false;
        while (!privateKeyPath || !privateKeyExists) {
          // eslint-disable-next-line no-await-in-loop
          const promptReturn = await inquirer.prompt([
            {
              type: 'input',
              name: 'privateKeyPath',
              message: 'Path to private key file',
            },
          ]);
          privateKeyPath = promptReturn.privateKeyPath;

          // eslint-disable-next-line no-await-in-loop
          privateKeyExists = await fileExists(privateKeyPath);
          if (!privateKeyExists) {
            printErrors(cerr, 'File does not exist at given path!');
          }
        }
        return privateKeyPath;
      },
    ],
  ])(args);

export const getPrivateKeyPassphrase = async (
  privateKeyHasEncryption: boolean,
): Promise<string> =>
  R.ifElse(
    // If the private key doesn't have encryption...
    R.not,
    // ... return an empty string
    R.always(''),
    // If the private key has encryption, ask for the password
    async () => {
      const { passphrase } = await inquirer.prompt([
        {
          type: 'password',
          name: 'passphrase',
          message: 'Private key password (never saved)',
          default: '',
        },
      ]);
      return passphrase;
    },
  )(privateKeyHasEncryption);
