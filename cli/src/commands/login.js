// @flow

import { green } from 'chalk';
import R from 'ramda';
import { getSshConfig } from '../config/getSshConfig';
import { sshConnect } from '../ssh/sshConnect';
import { sshExec } from '../ssh/sshExec';
import { fileExists, writeFile } from '../util/fs';
import { printErrors } from '../util/printErrors';

import typeof Yargs from 'yargs';
import type { CommandHandlerArgsWithOptions } from '../types/Command';

export const command = 'login';
export const description = 'Authenticate with lagoon via an SSH key';

const IDENTITY: 'identity' = 'identity';
const TOKEN: 'token' = 'token';

export const commandOptions = {
  [IDENTITY]: IDENTITY,
  [TOKEN]: TOKEN,
};

export function builder(yargs: Yargs) {
  return yargs.usage(`$0 ${command} - ${description}`).options({
    identity: {
      describe: 'Path to identity (private key)',
      type: 'string',
    },
  });
}

type Args = CommandHandlerArgsWithOptions<{
  +identity: string,
  +token: string,
}>;

export async function handler({
  clog,
  cerr,
  options: { identity, token: tokenFilePath },
}:
Args): Promise<number> {
  if (R.complement(R.isNil)(identity) && !(await fileExists(identity))) {
    return printErrors(cerr, {
      message: `File does not exist at identity option path: ${identity}`,
    });
  }

  let connection;
  const { username, host, port } = getSshConfig();

  console.log(`Logging in to lagoon at ${username}@${host}:${port}...`);

  try {
    connection = await sshConnect({
      identity,
      cerr,
    });
  } catch (err) {
    return printErrors(cerr, err);
  }

  const output = await sshExec(connection, 'token');
  const token = output.toString().replace(/(\r\n|\n|\r)/gm, '');
  await writeFile(tokenFilePath, token);

  clog(green('Logged in successfully.'));

  // Be responsible and close the connection after our transaction.
  connection.end();

  return 0;
}
