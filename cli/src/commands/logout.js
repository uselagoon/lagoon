// @flow

import { green } from 'chalk';
import { fileExists, unlink } from '../util/fs';

import typeof Yargs from 'yargs';
import type { CommandHandlerArgs } from '../types/Command';

export const command = 'logout';
export const description = 'Delete the authentication token';

const TOKEN: 'token' = 'token';

export const commandOptions = {
  [TOKEN]: TOKEN,
};

export function builder(yargs: Yargs) {
  return yargs.usage(`$0 ${command} - ${description}`);
}

export async function handler({
  clog,
  options: { token: tokenFilePath },
}:
CommandHandlerArgs): Promise<number> {
  if (tokenFilePath && (await fileExists(tokenFilePath))) {
    await unlink(tokenFilePath);
  }

  clog(green('Logged out successfully.'));

  return 0;
}
