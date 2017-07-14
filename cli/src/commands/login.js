// @flow

import os from 'os';
import path from 'path';
import { green } from 'chalk';
import inquirer from 'inquirer';
import { utils } from 'ssh2-streams';
import untildify from 'untildify';
import { sshConnect, sshExec } from '../util/ssh';
import { readFile, writeFile } from '../util/fs';

import typeof Yargs from 'yargs';
import type { BaseArgs } from './index';

const name = 'login';
const description = 'Authenticate with the amazee.io API via given SSH key';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs.usage(`$0 ${name} - ${description}`).argv;
}

type Args = BaseArgs;

export async function run({ clog }: Args): Promise<number> {
  const homeDir = os.homedir();

  const { privateKeyFilePath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'privateKeyFilePath',
      message: 'Path to private key file',
      default: path.join(homeDir, '.ssh', 'id_rsa'),
    },
  ]);
  const privateKey = await readFile(untildify(privateKeyFilePath));
  let passphrase = '';
  if (utils.parseKey(privateKey).encryption) {
    const promptReturn = await inquirer.prompt([
      {
        type: 'password',
        name: 'passphrase',
        message: 'Private key password (never saved)',
        default: '',
      },
    ]);
    passphrase = promptReturn.passphrase;
  }
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
