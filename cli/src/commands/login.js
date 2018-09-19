// @flow

import { green } from 'chalk';
import { getSshConfig } from '../config/getSshConfig';
import { runSshCommand } from '../util/runSshCommand';
import { writeFile } from '../util/fs';
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
  const { username, host, port } = getSshConfig();

  console.log(`Logging in to lagoon at ${username}@${host}:${port}...`);

  let token;

  try {
    token = await runSshCommand({ command: 'token', identity });
  } catch (err) {
    return printErrors(cerr, err);
  }

  if (!token) {
    return printErrors(
      cerr,
      'Empty token returned from Lagoon authentication server.',
    );
  }

  await writeFile(tokenFilePath, token);

  clog(green('Logged in successfully.'));

  return 0;
}
