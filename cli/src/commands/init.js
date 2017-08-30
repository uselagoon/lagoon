// @flow

import path from 'path';
import { green } from 'chalk';
import R from 'ramda';
import inquirer from 'inquirer';
import { createConfig } from '../util/config';
import { fileExists } from '../util/fs';
import { printErrors } from '../printErrors';

import typeof Yargs from 'yargs';
import type { BaseArgs } from '.';

const name = 'init';
const description =
  'Create a .amazeeio.yml config file in the current working directory';

type GetOverwriteOptionArgs = {
  exists: boolean,
  filepath: string,
  overwriteOption?: boolean,
};

const getOverwriteOption = async (
  args: GetOverwriteOptionArgs,
): Promise<boolean> =>
  R.cond([
    // If the file doesn't exist, the file doesn't need to be overwritten
    [R.propEq('exists', false), R.F],
    // If the overwrite option for the command has been specified, use the value of that
    [
      R.propSatisfies(
        // Option is not null or undefined
        R.complement(R.isNil),
        'overwriteOption',
      ),
      R.prop('overwriteOption'),
    ],
    // If none of the previous conditions have been satisfied, ask the user if they want to overwrite the file
    [
      R.T,
      async ({ filepath }) => {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `File '${filepath}' already exists! Overwrite?`,
            default: false,
          },
        ]);
        return overwrite;
      },
    ],
  ])(args);

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs
    .usage(`$0 ${name} - ${description}`)
    .options({
      overwrite: {
        describe: 'Overwrite the configuration file if it exists',
        type: 'boolean',
        default: undefined,
      },
      sitegroup: {
        describe: 'Name of sitegroup to configure',
        type: 'string',
        alias: 's',
      },
    })
    .example(
      `$0 ${name}`,
      'Create a config file at ./.amazeeio.yml. This will confirm with the user whether to overwrite the config if it already exists and also prompt for a sitegroup name to add to the config.\n',
    )
    .example(
      `$0 ${name} --overwrite`,
      'Overwrite existing config file (do not confirm with the user).\n',
    )
    .example(
      `$0 ${name} --overwrite false`,
      'Prevent overwriting of existing config file (do not confirm with user).\n',
    )
    .example(
      `$0 ${name} --sitegroup my_sitegroup`,
      'Set sitegroup to "my_sitegroup" (do not prompt the user).\n',
    )
    .example(
      `$0 ${name} -s my_sitegroup`,
      'Short form for setting sitegroup to "my_sitegroup" (do not prompt the user).\n',
    )
    .example(
      `$0 ${name} --overwrite --sitegroup my_sitegroup`,
      'Overwrite existing config files and set sitegroup to "my_sitegroup" (do not confirm with or prompt the user).',
    ).argv;
}

type Args = BaseArgs & {
  overwrite: ?boolean,
  sitegroup: ?string,
};

export async function run({
  cwd,
  overwrite: overwriteOption,
  sitegroup,
  clog,
  cerr,
}: Args): Promise<number> {
  const filepath = path.join(cwd, '.amazeeio.yml');

  const exists = await fileExists(filepath);

  const overwrite = await getOverwriteOption({
    exists,
    filepath,
    overwriteOption,
  });

  if (exists && !overwrite) {
    return printErrors(cerr, `Not overwriting existing file '${filepath}'.`);
  }

  const configInput = sitegroup
    ? { sitegroup }
    : await inquirer.prompt([
      {
        type: 'input',
        name: 'sitegroup',
        message: 'Enter the name of the sitegroup to configure.',
        validate: input =>
          input ? Boolean(input) : 'Please enter a sitegroup.',
      },
    ]);

  try {
    clog(`Creating file '${filepath}'...`);
    await createConfig(filepath, configInput);
    clog(green('Configuration file created!'));
  } catch (e) {
    return printErrors(cerr, `Error occurred while writing to ${filepath}:`, e);
  }

  return 0;
}

export default {
  setup,
  name,
  description,
  run,
};
