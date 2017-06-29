// @flow

/* eslint-disable no-console */

import os from 'os';
import path from 'path';
import { sshConnect, sshExec } from '../util/ssh';
import { readFile, deleteFile, doesFileExist } from '../util/fs';

import typeof { default as Yargs } from 'yargs';
import type { BaseArgs } from './index';

const name = 'logout';
const description = 'Invalidate and remove your authentication token';

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

  await sshExec(connection, 'logout');
  const tokenFilePath = path.join(homeDir, '.ioauth');
  if (await doesFileExist(tokenFilePath)) {
    await deleteFile(tokenFilePath);
  }

  clog('Logout successful');

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
