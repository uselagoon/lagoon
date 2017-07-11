// @flow

/* eslint-disable no-console */

import path from 'path';
import writeDefaultConfig from '../writeDefaultConfig';
import { fileExists } from '../util/fs';
import { exitError } from '../exit';

import typeof Yargs from 'yargs';
import type { BaseArgs } from './index';

const name = 'init';
const description = 'Creates a .amazeeio.yml config in the current working directory';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs.usage(`$0 ${name} - ${description}`).argv;
}

export async function run({ cwd, clog = console.log }: BaseArgs): Promise<number> {
  const filename = path.join(cwd, '.amazeeio.yml');

  if (await fileExists(filename)) {
    return exitError(clog, `File '${filename}' already exist!`);
  }

  try {
    clog(`Creating file '${filename}'...`);
    await writeDefaultConfig(filename);
    clog('Writing Successful');
  } catch (e) {
    clog(`Error occurred while writing to ${filename}:`);
    clog(e.message);
    return 1;
  }

  return 0;
}

export default {
  setup,
  name,
  description,
  run,
};
