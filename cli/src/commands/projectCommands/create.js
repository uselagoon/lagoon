// @flow

import { green } from 'chalk';
import inquirer from 'inquirer';
import R from 'ramda';
import { table } from 'table';
import urlRegex from 'url-regex';

import gql from '../../gql';
import { printGraphQLErrors } from '../../printErrors';
import { runGQLQuery } from '../../query';

import typeof Yargs from 'yargs';
import type { BaseArgs } from '..';

export const command = 'create';
export const description = 'Create new project';

export function builder(yargs: Yargs): Yargs {
  return yargs
    .usage(`$0 ${command} - ${description}`)
    .example('$0', 'Create new project');
}

type createProjectArgs = {
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function createProject({
  clog,
  cerr,
}:
createProjectArgs): Promise<number> {
  const query = gql`
    mutation AddProject($input: ProjectInput!) {
      addProject(input: $input) {
        id
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
  `;

  const projectInput = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: input => Boolean(input) || 'Please enter a project name.',
    },
    {
      type: 'input',
      name: 'git_url',
      message: 'Git URL:',
      validate: input =>
        // Verify that it is a valid URL and...
        (urlRegex({ exact: true }).test(input) &&
          // ...that it is either a URL from the big three git hosts or includes `.git` at the end of the string.
          /(github\.com|bitbucket\.org|gitlab\.com|\.git$)/.test(input)) ||
        // If the input is invalid, prompt the user to enter a valid Git URL
        'Please enter a valid Git URL.',
    },
  ]);

  const result = await runGQLQuery({
    query,
    cerr,
    variables: {
      input: {
        ...projectInput,
        // FIXME: Get the customer ID from the JWT or config or something
        customer: 1,
        openshift: 1,
      },
    },
  });

  const { errors } = result;
  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  const project = R.path(['data', 'addProject'], result);

  const projectName = R.prop('name', project);

  clog(green(`Project "${projectName}" created successfully:`));

  clog(table([
    ['Project Name', projectName],
    ['Customer', R.path(['customer', 'name'], project)],
    ['Git URL', R.prop('git_url', project)],
    ['Active Systems Deploy', R.prop('active_systems_deploy', project)],
    ['Active Systems Remove', R.prop('active_systems_remove', project)],
    ['Branches', String(R.prop('branches', project))],
    ['Pull Requests', String(R.prop('pullrequests', project))],
    ['Openshift', R.path(['openshift', 'name'], project)],
    ['Created', R.path(['created'], project)],
  ]));

  return 0;
}

export async function handler({
  clog,
  cerr,
  config,
}:
BaseArgs): Promise<number> {
  return createProject({ clog, cerr });
}
