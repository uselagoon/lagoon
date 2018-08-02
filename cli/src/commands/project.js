// @flow

import inquirer from 'inquirer';
import { table } from 'table';
import R from 'ramda';
import { answerWithOptionIfSetOrPrompt } from '../cli/answerWithOption';
import { visit } from '../cli/visit';
import { config } from '../config';
import gql from '../util/gql';
import { queryGraphQL } from '../util/queryGraphQL';
import { printGraphQLErrors } from '../util/printErrors';
import { getOptions } from '.';

import typeof Yargs from 'yargs';
import type { BaseHandlerArgs } from '.';

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
    .commandDir('projectCommands', { visit });
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

type ProjectDetailsArgs = {
  clog: typeof console.log,
  cerr: typeof console.error,
  options: OptionalOptions,
};

export async function projectDetails({
  clog,
  cerr,
  options,
}:
ProjectDetailsArgs): Promise<number> {
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

  clog(`Project details for '${projectName}':`);
  clog(
    table([
      ['Name', R.prop('name', project)],
      ['Customer', R.path(['customer', 'name'], project)],
      ['Git URL', R.prop('git_url', project)],
      ['Active Systems Deploy', R.prop('active_systems_deploy', project)],
      ['Active Systems Remove', R.prop('active_systems_remove', project)],
      ['Branches', String(R.prop('branches', project))],
      ['Pull Requests', String(R.prop('pullrequests', project))],
      ['Openshift', R.path(['openshift', 'name'], project)],
      ['Created', R.path(['created'], project)],
    ]),
  );

  return 0;
}

type Args = BaseHandlerArgs & {
  argv: {
    project: ?string,
  },
};

export async function handler({ clog, cerr, argv }: Args): Promise<number> {
  const options = getOptions({ config, argv, commandOptions });
  return projectDetails({ clog, cerr, options });
}
