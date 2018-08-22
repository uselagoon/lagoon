// @flow

import { green } from 'chalk';
import inquirer from 'inquirer';
import R from 'ramda';

import { answerWithOptionIfSetOrPrompt } from '../../cli/answerWithOption';
import gql from '../../util/gql';
import { printGraphQLErrors, printErrors } from '../../util/printErrors';
import { queryGraphQL } from '../../util/queryGraphQL';

import typeof Yargs from 'yargs';
import type { CommandHandlerArgsWithOptions } from '../../types/Command';

export const command = 'delete';
export const description = 'Delete a project';

export const PROJECT: 'project' = 'project';

export const commandOptions = {
  [PROJECT]: PROJECT,
};

type OptionalOptions = {
  project?: string,
};

type Options = {
  +project: string,
};

export function builder(yargs: Yargs): Yargs {
  return yargs
    .usage(`$0 ${command} - ${description}`)
    .options({
      [PROJECT]: {
        demandOption: false,
        describe: 'Name of project',
        type: 'string',
      },
    })
    .example(`$0 ${command}`, 'Delete a project (will prompt for project name)')
    .example(
      `$0 ${command} --${PROJECT} myproject`,
      'Delete the project named "myproject"',
    );
}

type PromptForQueryOptionsArgs = {|
  options: OptionalOptions,
  clog: typeof console.log,
|};

async function promptForQueryOptions({
  options,
  clog,
}:
PromptForQueryOptionsArgs): Promise<Options> {
  return inquirer.prompt([
    {
      type: 'input',
      name: PROJECT,
      message: 'Project name:',
      when: answerWithOptionIfSetOrPrompt({ option: PROJECT, options, clog }),
      validate: input =>
        Boolean(input) ||
        'Please enter a project name to delete or press CTRL-C to exit.',
    },
  ]);
}

type Args = CommandHandlerArgsWithOptions<{
  +project?: string,
}>;

export async function handler({ clog, cerr, options }: Args): Promise<number> {
  const { project: projectName } = await promptForQueryOptions({
    options,
    clog,
  });

  const result = await queryGraphQL({
    cerr,
    query: gql`
      mutation DeleteProject($input: DeleteProjectInput!) {
        deleteProject(input: $input)
      }
    `,
    variables: {
      input: {
        project: projectName,
      },
    },
  });

  const { errors } = result;
  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  const response = R.path(['data', 'deleteProject'])(result);

  if (!R.equals(response, 'success')) {
    return printErrors(cerr, {
      message: `Error: API responded with "${response || '<empty>'}"`,
    });
  }

  clog(green(`Project "${projectName}" deleted successfully!`));

  return 0;
}
