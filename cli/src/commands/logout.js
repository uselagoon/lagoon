// @flow

import os from 'os';
import path from 'path';
import { green } from 'chalk';
import { fileExists, unlink } from '../util/fs';

import typeof Yargs from 'yargs';
import type { BaseHandlerArgs } from '.';

export const command = 'logout';
export const description =
  'Delete the authentication token in $HOME/.lagoon-token';

export function builder(yargs: Yargs) {
  return yargs.usage(`$0 ${command} - ${description}`);
}

export async function handler({ clog }: BaseHandlerArgs): Promise<number> {
  const tokenFilePath = path.join(os.homedir(), '.lagoon-token');
  if (await fileExists(tokenFilePath)) {
    await unlink(tokenFilePath);
  }

  clog(green('Logged out successfully.'));

  return 0;
}
