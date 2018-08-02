// @flow

import path from 'path';
import { green } from 'chalk';
import inquirer from 'inquirer';
import R from 'ramda';
import tildify from 'tildify';
import untildify from 'untildify';
import { answerWithOptionIfSetOrPrompt } from '../cli/answerWithOption';
import { configDefaults, createConfig } from '../config';
import { fileExists } from '../util/fs';
import { getCommandOptions } from '../util/getCommandOptions';
import { printErrors } from '../util/printErrors';

import typeof Yargs from 'yargs';
import type { LagoonConfigInput } from '../config';
import type { BaseHandlerArgs } from '.';

export const command = 'init';
export const description =
  'Create a .lagoon.yml config file in the current working directory';

export const OVERWRITE: 'overwrite' = 'overwrite';
export const PROJECT: 'project' = 'project';
export const API: 'api' = 'api';
export const SSH: 'ssh' = 'ssh';
export const TOKEN: 'token' = 'token';

export const commandOptions = {
  [OVERWRITE]: OVERWRITE,
  [PROJECT]: PROJECT,
  [API]: API,
  [SSH]: SSH,
  [TOKEN]: TOKEN,
};

type OptionalOptions = {
  overwrite?: boolean,
  project?: string,
  api?: string,
  ssh?: string,
  token?: string,
};

export function builder(yargs: Yargs) {
  return yargs
    .usage(`$0 ${command} - ${description}`)
    .options({
      [OVERWRITE]: {
        describe: 'Overwrite the configuration file if it exists',
        type: 'boolean',
      },
      [PROJECT]: {
        describe: 'Name of project to configure',
        type: 'string',
      },
      [API]: {
        describe: 'API URL',
        type: 'string',
      },
      [SSH]: {
        describe: 'SSH URL',
        type: 'string',
      },
      [TOKEN]: {
        describe: 'Path to the Lagoon token file',
        type: 'string',
      },
    })
    .example(
      `$0 ${command}`,
      'Create a config file at ./.lagoon.yml. This will confirm with the user whether to overwrite the config if it already exists and also prompt for some parameters to add to the config.\n',
    )
    .example(
      `$0 ${command} --${OVERWRITE}`,
      'Overwrite existing config file (do not confirm with the user).\n',
    )
    .example(
      `$0 ${command} --${OVERWRITE} false`,
      'Prevent overwriting of existing config file (do not confirm with user).\n',
    )
    .example(
      `$0 ${command} --${PROJECT} my_project`,
      'Set project to "my_project" (do not prompt the user).\n',
    )
    .example(
      `$0 ${command} --${API} http://localhost:3000`,
      'Set API URL to "http://localhost:3000" (do not prompt the user).\n',
    )
    .example(
      `$0 ${command} --${SSH} localhost:2020`,
      'Set SSH URL to "localhost:2020" (do not prompt the user).\n',
    )
    .example(
      `$0 ${command} --${TOKEN} ~/tokens/.lagoon-token`,
      'Set the token path to ~/tokens/.lagoon-token (do not prompt the user).\n',
    )
    .example(
      `$0 ${command} --${API} --${SSH} --${TOKEN}`,
      'Skip configuration of API and SSH URLs and token path (do not prompt the user).\n',
    )
    .example(
      `$0 ${command} --${OVERWRITE} --${PROJECT} my_project --${API} --${SSH} --${TOKEN}`,
      'Overwrite existing config files, set project to "my_project" and skip configuration of API and SSH URLs and token path (do not confirm with or prompt the user for any parameters).',
    );
}

type PromptForOverwriteArgs = {|
  filepath: string,
  options: OptionalOptions,
  clog: typeof console.log,
|};

async function promptForOverwrite({
  filepath,
  options,
  clog,
}:
PromptForOverwriteArgs): Promise<{ [key: typeof OVERWRITE]: boolean }> {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: OVERWRITE,
      message: `File '${filepath}' already exists! Overwrite?`,
      default: false,
      when: answerWithOptionIfSetOrPrompt({
        option: OVERWRITE,
        options,
        notify: true,
        clog,
      }),
    },
  ]);
}

type InitArgs = {|
  cwd: string,
  options: OptionalOptions,
  clog: typeof console.log,
  cerr: typeof console.error,
|};

async function init({
  cwd, options, clog, cerr }:
InitArgs): Promise<number> {
  const filepath = path.join(cwd, '.lagoon.yml');
  const exists = await fileExists(filepath);

  const overwrite = !exists
    ? undefined
    : R.prop(
      OVERWRITE,
      await promptForOverwrite({
        filepath,
        options,
        clog,
      }),
    );

  if (exists && !overwrite) {
    return printErrors(cerr, {
      message: `Not overwriting existing file '${filepath}'.`,
    });
  }

  // $FlowFixMe inquirer$Answers is inexact, LagoonConfigInput is exact
  const configInput: LagoonConfigInput = await inquirer.prompt([
    {
      type: 'input',
      name: PROJECT,
      message: 'Enter the name of the project to configure.',
      validate: input => (input ? Boolean(input) : 'Please enter a project.'),
      when: answerWithOptionIfSetOrPrompt({
        option: PROJECT,
        options,
        notify: true,
        clog,
      }),
    },
    {
      type: 'input',
      name: API,
      message: 'Enter the API URL',
      when: answerWithOptionIfSetOrPrompt({
        option: API,
        options,
        notify: true,
        clog,
      }),
    },
    {
      type: 'input',
      name: SSH,
      message: 'Enter the SSH URL',
      when: answerWithOptionIfSetOrPrompt({
        option: SSH,
        options,
        notify: true,
        clog,
      }),
    },
    {
      type: 'input',
      name: TOKEN,
      message: `Change the path for the token (default: ${R.compose(
        tildify,
        R.prop('token'),
      )(configDefaults)})`,
      when: answerWithOptionIfSetOrPrompt({
        option: TOKEN,
        options,
        notify: true,
        clog,
      }),
      filter: untildify,
    },
  ]);

  try {
    clog(`Creating file '${filepath}'...`);
    await createConfig(filepath, configInput);
    clog(green('Configuration file created!'));
    return 0;
  } catch (e) {
    return printErrors(
      cerr,
      { message: `Error occurred while creating config at ${filepath}:` },
      e,
    );
  }
}

type Args = BaseHandlerArgs & {
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
  const options = getCommandOptions({
    config: null,
    argv,
    commandOptions,
    dynamicOptionKeys: [OVERWRITE],
  });

  return init({
    cwd,
    options,
    clog,
    cerr,
  });
}
