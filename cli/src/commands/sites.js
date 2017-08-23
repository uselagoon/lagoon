// @flow

import { table } from 'table';
import { red } from 'chalk';
import { prepend, pathOr, propOr, map, compose, sortBy, toLower } from 'ramda';

import gql from '../gql';
import { runGQLQuery } from '../query';
import { printNoConfigError, printGraphQLErrors } from '../printErrors';

import typeof Yargs from 'yargs';
import type { BaseArgs } from './index';

const name = 'sites';
const description = 'List all sites for a sitegroup';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs
    .usage(`$0 ${name} - ${description}`)
    .options({
      sitegroup: {
        demandOption: false,
        describe: 'Specify a sitegroup for the site list',
        type: 'string',
      },
    })
    .alias('s', 'sitegroup')
    .example(
      `$0 ${name}`,
      'List all sites for the sitegroup configured in .amazeeio.yml',
    )
    .example(
      `$0 ${name} -s mysitegroup`,
      'List all sites for the sitegroup "mysitegroup"',
    ).argv;
}

type ListSitesArgs = {
  sitegroup: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function listSites({
  sitegroup,
  clog,
  cerr,
}: ListSitesArgs): Promise<number> {
  const query = gql`
    query querySites($sitegroup: String!) {
      siteGroupByName(name: $sitegroup) {
        gitUrl
        sites {
          siteName
          siteBranch
          siteEnvironment
        }
      }
    }
  `;

  const result = await runGQLQuery({
    query,
    variables: { sitegroup },
  });

  const { errors } = result;
  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  const sortBySite = sortBy(compose(toLower, propOr('', 'siteName')));

  const nodes = compose(
    sortBySite,
    pathOr([], ['data', 'siteGroupByName', 'sites']),
  )(result);

  if (nodes.length === 0) {
    clog(red(`No sites found for sitegroup '${sitegroup}'`));
    return 0;
  }

  clog(`Sites for '${sitegroup}':`);

  const tableConfig = {
    columns: {
      // $FlowIssue: Flow doesn't understand numbers as keys https://github.com/facebook/flow/issues/380
      0: {
        // eslint-disable-line quote-props
        alignment: 'left',
        minWidth: 15,
      },
      // $FlowIssue: Flow doesn't understand numbers as keys https://github.com/facebook/flow/issues/380
      1: {
        // eslint-disable-line quote-props
        alignment: 'left',
        minWidth: 15,
      },
      // $FlowIssue: Flow doesn't understand numbers as keys https://github.com/facebook/flow/issues/380
      2: {
        // eslint-disable-line quote-props
        alignment: 'center',
        minWidth: 15,
      },
    },
  };

  const tableBody = map((node) => {
    const inProdMarker = node.siteEnvironment === 'production' ? '\u221A' : '';
    return [node.siteName, node.siteBranch, inProdMarker];
  }, nodes);

  const tableData = prepend(['Site', 'Branch', 'Deployed?'], tableBody);

  clog(table(tableData, tableConfig));

  return 0;
}

type Args = BaseArgs & {
  sitegroup: ?string,
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function run(args: Args): Promise<number> {
  // eslint-disable-next-line no-console
  const { config, clog, cerr } = args;

  // FIXME: doesn't handle empty config file case correctly
  if (config == null) {
    return printNoConfigError(cerr);
  }

  const sitegroup = args.sitegroup || config.sitegroup;
  return listSites({ sitegroup, clog, cerr });
}

export default {
  setup,
  name,
  description,
  run,
};
