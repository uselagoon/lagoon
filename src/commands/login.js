// @flow

/* eslint-disable no-console */

import os from 'os';
import path from 'path';
import { sshConnect, sshExec } from '../util/ssh';
import { readFile } from '../util/fs';
import { exitError } from '../exit';

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

  const privateKey = await readFile(path.join(os.homedir(), '.ssh', 'id_rsa'));
  const connection = await sshConnect({
    host: 'localhost',
    port: 2020,
    username: 'api',
    privateKey,
  });

  const output = await sshExec(connection, 'login');

  // TODO: Instead of logging the output, save it.
  clog(output.toString());

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
