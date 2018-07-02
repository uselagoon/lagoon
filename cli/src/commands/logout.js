// @flow

import { green } from 'chalk';
import R from 'ramda';
import { config, configDefaults } from '../config';
import { fileExists, unlink } from '../util/fs';

import typeof Yargs from 'yargs';
import type { BaseHandlerArgs } from '.';

const tokenFilePath = R.prop('token', { ...configDefaults, ...config });

export const command = 'logout';
export const description = `Delete the authentication token at ${tokenFilePath}`;

export function builder(yargs: Yargs) {
  return yargs.usage(`$0 ${command} - ${description}`);
}

export async function handler({ clog }: BaseHandlerArgs): Promise<number> {
  if (await fileExists(tokenFilePath)) {
    await unlink(tokenFilePath);
  }

  clog(green('Logged out successfully.'));

  return 0;
}
