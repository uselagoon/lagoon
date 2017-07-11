// @flow

/* eslint-disable no-console */

import path from 'path';
import { green } from 'chalk';
import inquirer from 'inquirer';
import createConfig from '../createConfig';
import { fileExists } from '../util/fs';
import { printErrors } from '../printErrors';

import typeof Yargs from 'yargs';
import type { BaseArgs } from './index';

const name = 'init';
const description = 'Creates a .amazeeio.yml config in the current working directory';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs.usage(`$0 ${name} - ${description}`).argv;
}

export async function run({ cwd, clog = console.log }: BaseArgs): Promise<number> {
  const filepath = path.join(cwd, '.amazeeio.yml');

  if (await fileExists(filepath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `File '${filepath}' already exists! Overwrite?`,
        default: false,
      },
    ]);
    if (!overwrite) return printErrors(clog, `Not overwriting existing file '${filepath}'.`);
  }

  try {
    clog(`Creating file '${filepath}'...`);
    await writeDefaultConfig(filepath);
    clog(green('Configuration file created!'));
  } catch (e) {
    return printErrors(clog, `Error occurred while writing to ${filepath}:`, e);
  }

  return 0;
}

export default {
  setup,
  name,
  description,
  run,
};
