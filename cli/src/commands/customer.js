// @flow

import { table } from 'table';
import { red } from 'chalk';
import R from 'ramda';

import { config } from '../config';
import gql from '../util/gql';
import { queryGraphQL } from '../util/queryGraphQL';
import {
  printProjectConfigurationError,
  printGraphQLErrors,
} from '../util/printErrors';

import typeof Yargs from 'yargs';
import type { BaseHandlerArgs } from '.';

export const command = 'customer';
export const description = 'Show customer details for a given project name';

const PROJECT: 'project' = 'project';

export const commandOptions = {
  [PROJECT]: PROJECT,
};

export function builder(yargs: Yargs) {
  return yargs
    .usage(`$0 ${command} - ${description}`)
    .options({
      [PROJECT]: {
        demandOption: false,
        describe: 'Specify a project for the customer',
        type: 'string',
      },
    })
    .alias('p', 'project')
    .example(
      `$0 ${command}`,
      'Show customer details for the project configured in .lagoon.yml',
    )
    .example(
      `$0 ${command} --${PROJECT} myproject`,
      'Show customer details for the project "myproject"',
    );
}

type GetCustomerDetailsArgs = {
  project: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function getCustomerDetails({
  project,
  clog,
  cerr,
}:
GetCustomerDetailsArgs): Promise<number> {
  const result = await queryGraphQL({
    cerr,
    query: gql`
      query CustomerByProjectName($project: String!) {
        projectByName(name: $project) {
          customer {
            name
            comment
            private_key
            sshKeys {
              name
              keyValue
              keyType
              created
            }
            created
          }
        }
      }
    `,
    variables: { project },
  });

  const { errors } = result;
  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  const customer = R.path(['data', 'projectByName', 'customer'], result);

  if (customer == null) {
    clog(red(`No customer found for project '${project}'!`));
    return 0;
  }

  const formatDeployPrivateKey = R.ifElse(
    R.identity,
    R.always('\u221A'),
    R.always('\u2717'),
  );
  const formatSshKeys: (Array<Object>) => Array<string> = R.map(R.prop('name'));

  clog(`Customer details for project '${project}':`);
  clog(
    table([
      ['Name', R.prop('name', customer)],
      ['Comment', R.prop('comment', customer)],
      [
        'Deploy Private Key',
        formatDeployPrivateKey(R.prop('private_key', customer)),
      ],
      [
        'SSH Keys',
        R.join(', ', formatSshKeys(R.propOr([], 'sshKeys')(customer))),
      ],
      ['Created', R.prop('created', customer)],
    ]),
  );

  return 0;
}

type Args = BaseHandlerArgs & {
  argv: {
    project: ?string,
  },
};

export async function handler({ argv, clog, cerr }: Args): Promise<number> {
  const project: ?string = R.prop('project', argv) || R.prop('project', config);

  if (project == null) {
    return printProjectConfigurationError(cerr);
  }

  return getCustomerDetails({ project, clog, cerr });
}
