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
  return yargs.usage(`$0 ${name} - ${description}`).options({
    overwrite: { describe: 'Overwrite the configuration file if it exists', default: false },
    sitegroup: { describe: 'Name of sitegroup to configure', type: 'string', alias: 's' },
  }).argv;
}

type Args = BaseArgs & {
  overwrite: ?boolean,
  sitegroup: ?string,
};

export async function run({
  cwd,
  overwrite: overwriteOption,
  sitegroup,
  clog = console.log,
}: Args): Promise<number> {
  const filepath = path.join(cwd, '.amazeeio.yml');

  const exists = await fileExists(filepath);

  if (!overwriteOption && exists) {
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

  const configInput = sitegroup
    ? { sitegroup }
    : await inquirer.prompt([
      {
        type: 'input',
        name: 'sitegroup',
        message: 'Enter the name of the sitegroup to configure.',
        validate: input => (input ? Boolean(input) : 'Please enter a sitegroup.'),
      },
    ]);

  try {
    clog(`Creating file '${filepath}'...`);
    await createConfig(filepath, configInput);
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
