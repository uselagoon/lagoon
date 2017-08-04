// @flow

import os from 'os';
import path from 'path';
import { green } from 'chalk';
import inquirer from 'inquirer';
import R from 'ramda';
import { utils } from 'ssh2-streams';
import untildify from 'untildify';
import { sshConnect, sshExec } from '../util/ssh';
import { fileExists, readFile, writeFile } from '../util/fs';
import { printErrors } from '../printErrors';

import typeof Yargs from 'yargs';
import type { BaseArgs } from './index';

const name = 'login';
const description = 'Authenticate with amazee.io via an SSH key';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs.usage(`$0 ${name} - ${description}`).options({
    identity: {
      describe: 'Path to identity (private key)',
      type: 'string',
      alias: 'i',
    },
  }).argv;
}

type GetPrivateKeyPathArgs = {
  fileExistsAtDefaultPath: boolean,
  defaultPrivateKeyPath: string,
  identityOption?: string,
  cerr: typeof console.error,
};

const getPrivateKeyPath = async (
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

const getPrivateKeyPassphrase = async (
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

type Args = BaseArgs & {
  identity: string,
};

export async function run({
  clog,
  cerr,
  identity: identityOption,
  }: Args): Promise<number> {
  if (identityOption != null && !await fileExists(identityOption)) {
    return printErrors(cerr, 'File does not exist at identity option path!');
  }

  const homeDir = os.homedir();
  const defaultPrivateKeyPath = path.join(homeDir, '.ssh', 'id_rsa');
  const fileExistsAtDefaultPath = await fileExists(defaultPrivateKeyPath);

  const privateKeyPath = await getPrivateKeyPath({
    fileExistsAtDefaultPath,
    defaultPrivateKeyPath,
    identityOption,
    cerr,
  });

  const privateKey = await readFile(untildify(privateKeyPath));
  const passphrase = await getPrivateKeyPassphrase(
    utils.parseKey(privateKey).encryption,
  );

  const connection = await sshConnect({
    host: process.env.SSH_AUTH_HOST || 'auth.amazee.io',
    port: Number(process.env.SSH_AUTH_PORT) || 2020,
    username: process.env.SSH_AUTH_USER || 'api',
    privateKey,
    passphrase,
  });

  const output = await sshExec(connection, 'login');
  const token = output.toString();
  const tokenFilePath = path.join(homeDir, '.ioauth');
  await writeFile(tokenFilePath, token);

  clog(green('Login successful'));

  // Be responsible and close the connection after our transaction.
  connection.end();

  return 0;
}

export default {
  setup,
  name,
  description,
  run,
};
