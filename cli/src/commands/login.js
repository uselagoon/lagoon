// @flow

import os from 'os';
import path from 'path';
import { green } from 'chalk';
import { sshConnect, sshExec } from '../util/ssh';
import { fileExists, writeFile } from '../util/fs';
import { printErrors } from '../printErrors';

import typeof Yargs from 'yargs';
import type { BaseArgs } from '.';

export const command = 'login';
export const description = 'Authenticate with lagoon via an SSH key';

export function builder(yargs: Yargs) {
  return yargs.usage(`$0 ${command} - ${description}`).options({
    identity: {
      describe: 'Path to identity (private key)',
      type: 'string',
      alias: 'i',
    },
  });
}

type Args = BaseArgs & {
  argv: {
    identity: string,
  },
};

export async function handler({ clog, cerr, argv }: Args): Promise<number> {
  if (argv.identity != null && !(await fileExists(argv.identity))) {
    return printErrors(cerr, 'File does not exist at identity option path!');
  }

  let connection;

  try {
    connection = await sshConnect({
      identity: argv.identity,
    });
  } catch (err) {
    return printErrors(cerr, err);
  }

  const output = await sshExec(connection, 'token');
  const token = output.toString().replace(/(\r\n|\n|\r)/gm, '');
  const tokenFilePath = path.join(os.homedir(), '.lagoon-token');
  await writeFile(tokenFilePath, token);

  clog(green('Logged in successfully.'));

  // Be responsible and close the connection after our transaction.
  connection.end();

  return 0;
}
