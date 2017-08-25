// @flow

import { table } from 'table';
import { red } from 'chalk';
import R from 'ramda';

import gql from '../gql';
import { runGQLQuery } from '../query';
import { printNoConfigError, printGraphQLErrors } from '../printErrors';

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

const name = 'client';
const description = 'Show client information for a sitegroup';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs
    .usage(`$0 ${name} - ${description}`)
    .options({
      sitegroup: {
        demandOption: false,
        describe: 'Specify a sitegroup for the client information',
        type: 'string',
      },
    })
    .alias('s', 'sitegroup')
    .example(
      `$0 ${name}`,
      'Show client information for the sitegroup configured in .amazeeio.yml',
    )
    .example(
      `$0 ${name} -s mysitegroup`,
      'Show client information for the sitegroup "mysitegroup"',
    ).argv;
}

type GetClientInfoArgs = {
  sitegroup: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function getClientInfo({
  sitegroup,
  clog,
  cerr,
}: GetClientInfoArgs): Promise<number> {
  const query = gql`
    query queryClient($sitegroup: String!) {
      siteGroupByName(name: $sitegroup) {
        client {
          clientName
          deployPrivateKey
          created
          comment
          siteGroups {
            siteGroupName
          }
          sshKeys {
            owner
            key
            type
          }
        }
      }
    }
  `;

  const result = await runGQLQuery({
    cerr,
    query,
    variables: { sitegroup },
  });

  const { errors } = result;
  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  const client = R.path(['data', 'siteGroupByName', 'client'], result);

  if (client == null) {
    clog(red(`No client found for sitegroup '${sitegroup}'`));
    return 0;
  }

  const formatDeployPrivateKey = R.ifElse(
    R.identity,
    R.always('\u221A'),
    R.always(''),
  );
  const formatSiteGroups = R.map(R.prop('siteGroupName'));
  const formatSshKeys = R.map(R.prop('owner'));

  const tableBody = [
    ['Client Name', R.prop('clientName', client)],
    [
      'Deploy Private Key',
      formatDeployPrivateKey(R.prop('deployPrivateKey', client)),
    ],
    ['Created', R.prop('created', client)],
    ['Comment', R.prop('comment', client)],
    [
      'Site Groups',
      R.join(', ', formatSiteGroups(R.propOr([], 'siteGroups', client))),
    ],
    ['SSH Keys', R.join(', ', formatSshKeys(R.propOr([], 'sshKeys', client)))],
  ];
  const tableData = R.filter(onlyValues)(tableBody);

  clog(`Client information for sitegroup '${sitegroup}'`);
  clog(table(tableData, tableConfig));

  return 0;
}

type Args = BaseArgs & {
  sitegroup: ?string,
};

export async function run(args: Args): Promise<number> {
  const { config, clog, cerr } = args;

  // FIXME: doesn't handle empty config file case correctly
  if (config == null) {
    return printNoConfigError(cerr);
  }

  const sitegroup = args.sitegroup || config.sitegroup;
  return getClientInfo({ sitegroup, clog, cerr });
}

export default {
  setup,
  name,
  description,
  run,
};
