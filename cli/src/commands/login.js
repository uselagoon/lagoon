// @flow

import { green } from 'chalk';
import R from 'ramda';
import { config, configDefaults, getSshConfig } from '../config';
import { sshConnect } from '../ssh/sshConnect';
import { sshExec } from '../ssh/sshExec';
import { fileExists, writeFile } from '../util/fs';
import { printErrors } from '../printErrors';

import typeof Yargs from 'yargs';
import type { BaseHandlerArgs } from '.';

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

type Args = BaseHandlerArgs & {
  argv: {
    identity: string,
  },
};

export async function handler({ clog, cerr, argv }: Args): Promise<number> {
  if (argv.identity != null && !(await fileExists(argv.identity))) {
    return printErrors(cerr, {
      message: 'File does not exist at identity option path!',
    });
  }

  let connection;
  const { username, host, port } = getSshConfig();

  console.log(`Logging in to lagoon at ${username}@${host}:${port}...`);
  try {
    connection = await sshConnect({
      identity: argv.identity,
      cerr,
    });
  } catch (err) {
    return printErrors(cerr, err);
  }

  const output = await sshExec(connection, 'token');
  const token = output.toString().replace(/(\r\n|\n|\r)/gm, '');
  const tokenFilePath = R.prop('token', { ...configDefaults, ...config });
  await writeFile(tokenFilePath, token);

  clog(green('Logged in successfully.'));

  // Be responsible and close the connection after our transaction.
  connection.end();

  return 0;
}
