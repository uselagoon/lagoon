// @flow

/* eslint-disable no-console */

import os from 'os';
import path from 'path';
import { sshConnect, sshExec } from '../util/ssh';
import { readFile, writeFile } from '../util/fs';

import typeof { default as Yargs } from 'yargs';
import type { BaseArgs } from './index';

const name = 'login';
const description =
  'Uses your SSH key to authenticate you with the amazee.io API';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs.usage(`$0 ${name} - ${description}`).argv;
}

type Args = BaseArgs;

export async function run(args: Args): Promise<number> {
  const { clog = console.log } = args;

  // TODO: We need to make the ssh key path lookup smarter or request it via prompt.
  const homeDir = os.homedir();
  const privateKeyFilePath = path.join(homeDir, '.ssh', 'id_rsa');
  const privateKey = await readFile(privateKeyFilePath);
  const connection = await sshConnect({
    host: process.env.SSH_AUTH_HOST || 'auth.amazee.io',
    port: process.env.SSH_AUTH_PORT || 2020,
    username: process.env.SSH_AUTH_USER || 'api',
    privateKey,
  });

  const output = await sshExec(connection, 'login');
  const token = output.toString();
  const tokenFilePath = path.join(homeDir, '.ioauth');
  await writeFile(tokenFilePath, token);

  clog('Login successful');

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
