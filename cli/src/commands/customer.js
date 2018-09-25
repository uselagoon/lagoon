// @flow

import { red } from 'chalk';
import R from 'ramda';
import format from '../util/format';
import gql from '../util/gql';
import { queryGraphQL } from '../util/queryGraphQL';
import {
  printProjectConfigurationError,
  printGraphQLErrors,
} from '../util/printErrors';

import typeof Yargs from 'yargs';
import type { CommandHandlerArgsWithOptions } from '../types/Command';

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
    .example(
      `$0 ${command}`,
      'Show customer details for the project configured in .lagoon.yml',
    )
    .example(
      `$0 ${command} --${PROJECT} myproject`,
      'Show customer details for the project "myproject"',
    );
}

type Args = CommandHandlerArgsWithOptions<{
  +project?: string,
}>;

export async function handler({
  options: { project },
  clog,
  cerr,
}:
Args): Promise<number> {
  if (project == null) {
    return printProjectConfigurationError(cerr);
  }

  const result = await queryGraphQL({
    cerr,
    query: gql`
      query CustomerByProjectName($project: String!) {
        projectByName(name: $project) {
          customer {
            name
            comment
            privateKey
            users {
              id
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

  const convertPrivateKeyToSymbol = R.ifElse(
    R.identity,
    R.always('\u221A'), // √
    R.always('\u2717'), // ✗
  );

  const formatUsers: (Array<Object>) => Array<string> = R.map(R.prop('id'));

  clog(`Customer details for project '${project}':`);
  clog(
    format([
      ['Name', 'Comment', 'Deploy Private Key', 'Users', 'Created'],
      [
        R.prop('name', customer),
        String(R.prop('comment', customer)),
        convertPrivateKeyToSymbol(R.prop('privateKey', customer)),
        R.join(', ', formatUsers(R.propOr([], 'users')(customer))),
        R.prop('created', customer),
      ],
    ]),
  );

  return 0;
}
