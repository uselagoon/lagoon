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

export const command = 'init';
export const description =
  'Create a .lagoon.yml config file in the current working directory';

type GetOverwriteOptionArgs = {
  exists: boolean,
  filepath: string,
  overwrite: ?boolean,
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
        'overwrite',
      ),
      R.prop('overwrite'),
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

export function builder(yargs: Yargs) {
  return yargs
    .usage(`$0 ${command} - ${description}`)
    .options({
      overwrite: {
        describe: 'Overwrite the configuration file if it exists',
        type: 'boolean',
        default: undefined,
      },
      project: {
        describe: 'Name of project to configure',
        type: 'string',
        alias: 'p',
      },
    })
    .example(
      `$0 ${command}`,
      'Create a config file at ./.lagoon.yml. This will confirm with the user whether to overwrite the config if it already exists and also prompt for a project name to add to the config.\n',
    )
    .example(
      `$0 ${command} --overwrite`,
      'Overwrite existing config file (do not confirm with the user).\n',
    )
    .example(
      `$0 ${command} --overwrite false`,
      'Prevent overwriting of existing config file (do not confirm with user).\n',
    )
    .example(
      `$0 ${command} --project my_project`,
      'Set project to "my_project" (do not prompt the user).\n',
    )
    .example(
      `$0 ${command} -p my_project`,
      'Short form for setting project to "my_project" (do not prompt the user).\n',
    )
    .example(
      `$0 ${command} --overwrite --project my_project`,
      'Overwrite existing config files and set project to "my_project" (do not confirm with or prompt the user).',
    );
}

type Args = BaseArgs & {
  argv: {
    overwrite: ?boolean,
    project: ?string,
  },
};

export async function handler({
  cwd,
  argv,
  clog,
  cerr,
}:
Args): Promise<number> {
  const filepath = path.join(cwd, '.lagoon.yml');

  const exists = await fileExists(filepath);

  const overwrite = await getOverwriteOption({
    exists,
    filepath,
    overwrite: argv.overwrite,
  });

  if (exists && !overwrite) {
    return printErrors(cerr, `Not overwriting existing file '${filepath}'.`);
  }

  const configInput = argv.project
    ? { project: argv.project }
    : await inquirer.prompt([
      {
        type: 'input',
        name: 'project',
        message: 'Enter the name of the project to configure.',
        validate: input =>
          input ? Boolean(input) : 'Please enter a project.',
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
