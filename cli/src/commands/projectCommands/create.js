// @flow

import inquirer from 'inquirer';
import urlRegex from 'url-regex';

import gql from '../../gql';
import { runGQLQuery } from '../../query';

import typeof Yargs from 'yargs';
import type { BaseArgs } from '..';

export const command = 'create';
export const description = 'Create new project';

export function builder(yargs: Yargs): Yargs {}

type createProjectArgs = {
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function createProject({
  clog,
  cerr,
}:
createProjectArgs): Promise<number> {
  const mutation = gql`
    mutation AddProject($input: ProjectInput!) {
      addProject(input: $input) {
        id
        name
        customer {
          id
        }
        git_url
        active_systems_deploy
        active_systems_remove
        branches
        pullrequests
        openshift {
          id
        }
        sshKeys {
          id
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

  // TODO: Also add a mutation property
  const result = await runGQLQuery({
    query: mutation,
    variables: {
      input: {
        ...projectInput,
        // FIXME: Get the customer ID from the JWT or config or something
        customer: 1,
        openshift: 1,
      },
    },
  });

  console.log(result);
}

export async function handler({
  clog,
  cerr,
  config,
}:
BaseArgs): Promise<number> {
  return createProject({ clog, cerr });
}
