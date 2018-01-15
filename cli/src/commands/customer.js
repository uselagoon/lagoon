// @flow

import { table } from 'table';
import { red } from 'chalk';
import R from 'ramda';

import gql from '../gql';
import { runGQLQuery } from '../query';
import {
  printNoConfigError,
  printProjectConfigurationError,
  printGraphQLErrors,
} from '../printErrors';

import typeof Yargs from 'yargs';
import type { BaseArgs } from '.';

const tableConfig = {
  columns: {
    // $FlowIssue: Flow doesn't understand numbers as keys https://github.com/facebook/flow/issues/380
    0: {
      alignment: 'left',
      minWidth: 15,
    },
    // $FlowIssue: Flow doesn't understand numbers as keys https://github.com/facebook/flow/issues/380
    1: {
      alignment: 'left',
      minWidth: 15,
    },
  },
};

// Common filter
const onlyValues = ([, value]: [string, string]) =>
  value != null && value !== '';

const name = 'customer';
const description = 'Show customer information for a given project id';

export function setup(yargs: Yargs) {
  return yargs
    .usage(`$0 ${name} - ${description}`)
    .options({
      project: {
        demandOption: false,
        describe: 'Specify a project for the customer',
        type: 'string',
      },
    })
    .alias('p', 'project')
    .example(
      `$0 ${name}`,
      'Show customer information for the project configured in .lagoon.yml',
    )
    .example(
      `$0 ${name} -p myproject`,
      'Show customer information for the project "myproject"',
    );
}

type GetCustomerInfoArgs = {
  project: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function getCustomerInfo({
  project,
  clog,
  cerr,
}:
GetCustomerInfoArgs): Promise<number> {
  const query = gql`
    query queryCustomer($project: String!) {
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
  `;

  const result = await runGQLQuery({
    cerr,
    query,
    variables: { project },
  });

  const { errors } = result;
  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  const customer = R.path(['data', 'projectByName', 'customer'], result);

  if (customer == null) {
    clog(red(`No customer found for project '${project}'`));
    return 0;
  }

  const formatDeployPrivateKey = R.ifElse(
    R.identity,
    R.always('\u221A'),
    R.always(''),
  );
  const formatSshKeys = R.map(R.prop('name'));

  const tableBody = [
    ['customer Name', R.prop('name', customer)],
    [
      'Deploy Private Key',
      formatDeployPrivateKey(R.prop('private_key', customer)),
    ],
    ['Comment', R.prop('comment', customer)],
    ['SSH Keys', R.join(', ', formatSshKeys(R.propOr([], 'sshKeys', customer)))],
    ['Created', R.prop('created', customer)],
  ];
  const tableData = R.filter(onlyValues)(tableBody);

  clog(`Customer information for project '${project}'`);
  clog(table(tableData, tableConfig));

  return 0;
}

type Args = BaseArgs & {
  project: ?string,
};

export async function run(args: Args): Promise<number> {
  const { config, clog, cerr } = args;

  if (config == null) {
    return printNoConfigError(cerr);
  }

  const project = args.project || config.project;

  if (project == null) {
    return printProjectConfigurationError(cerr);
  }

  return getCustomerInfo({ project, clog, cerr });
}

export default {
  setup,
  name,
  description,
  run,
};
