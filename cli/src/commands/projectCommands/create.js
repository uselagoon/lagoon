// @flow

import inquirer from 'inquirer';
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
    mutation AddProject($name: String!) {
      addProject(
        input: {
          name: $name
          customer: 1
          git_url: "https://example.com"
          active_systems_deploy: ""
          active_systems_remove: ""
          branches: "master"
          pullrequests: false
          openshift: 1
        }
      ) {
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
  ]);

  // TODO: Also add a mutation property
  const result = await runGQLQuery({
    query: mutation,
    variables: { name: projectInput.name },
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
