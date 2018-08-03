// @flow

import inquirer from 'inquirer';
import R from 'ramda';
import { answerWithOptionIfSetOrPrompt } from '../cli/answerWithOption';
import { setConfigForHandlers } from '../cli/setConfigForHandlers';
import format from '../util/format';
import gql from '../util/gql';
import { queryGraphQL } from '../util/queryGraphQL';
import { printGraphQLErrors } from '../util/printErrors';

import typeof Yargs from 'yargs';
import type { CommandHandlerArgsWithOptions } from '../types/Command';

export const command = 'project';
export const description = 'Show project details';

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
    .example(
      `$0 ${command}`,
      'Show details for the project configured in .lagoon.yml',
    )
    .example(
      `$0 ${command} --${PROJECT} myproject`,
      'Show details of project "myproject"',
    )
    .commandDir('projectCommands', { visit: setConfigForHandlers });
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
      query ProjectByName($project: String!) {
        projectByName(name: $project) {
          name
          customer {
            name
          }
          git_url
          active_systems_deploy
          active_systems_remove
          branches
          pullrequests
          openshift {
            name
          }
          created
        }
      }
    `,
    variables: { project: projectName },
  });

  const { errors } = result;
  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  const project = R.path(['data', 'projectByName'])(result);

  if (project == null) {
    clog(`No project '${projectName}' found.`);
    return 0;
  }

  clog(
    format([
      [
        'Name',
        'Customer',
        'Git URL',
        'Active Systems Deploy',
        'Active Systems Remove',
        'Branches',
        'Pull Requests',
        'Openshift',
        'Created',
      ],
      [
        R.prop('name', project),
        R.path(['customer', 'name'], project),
        R.prop('git_url', project),
        R.prop('active_systems_deploy', project),
        R.prop('active_systems_remove', project),
        String(R.prop('branches', project)),
        String(R.prop('pullrequests', project)),
        R.path(['openshift', 'name'], project),
        R.path(['created'], project),
      ],
    ]),
  );

  return 0;
}
