// @flow

/* eslint-disable no-console */

import { table } from 'table';
import { red } from 'chalk';
import {
  prepend,
  pathOr,
  prop,
  propOr,
  map,
  compose,
  // $FlowIssue: sortBy is not yet working: https://github.com/flowtype/flow-typed/blob/a9e64f62729fa4ecec82648f0a3f47afeff77574/definitions/npm/ramda_v0.x.x/flow_v0.34.x-/ramda_v0.x.x.js#L460-L462
  sortBy,
  toLower,
} from 'ramda';

import gql from '../gql';
import { runGQLQuery } from '../query';
import { exitNoConfig, exitError, exitGraphQLError } from '../exit';

import typeof { default as Yargs } from 'yargs';
import type { BaseArgs } from './index';

const name = 'list';
const description = 'Lists specific deployment information';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs
    .usage(`$0 ${name} [target] - ${description}`)
    .options({
      sitegroup: {
        demandOption: false,
        describe:
          'Overrides the currently configured sitegroup (.amazeeio.yml)',
        type: 'string',
      },
    })
    .alias('s', 'sitegroup')
    .example(
      `$0 ${name} sites`,
      'Lists all sites for the specific sitegroup configured in your .amazeeio.yml config file',
    )
    .example(
      `$0 ${name} sites -s mysitegroup`,
      'Lists all sites for a specific sitegroup (instead of using the config file)',
    ).argv;
}

type Target = 'sites';

type Args = BaseArgs & {
  sitegroup: ?string,
  target: Target,
};

export async function run(args: Args): Promise<number> {
  const { config, clog = console.log } = args;

  if (config == null) {
    return exitNoConfig(clog);
  }

  const [target] = args._.slice(1);
  const sitegroup = args.sitegroup || config.sitegroup;

  switch (target) {
    case 'sites':
      return listSites({ sitegroup });
    default:
      return exitError(
        clog,
        `Unknown target ${target} ... possible values: 'sites'`,
        1,
      );
  }
}

type MainArgs = {
  sitegroup: string,
  clog?: typeof console.log,
};

export async function listSites(args: MainArgs): Promise<number> {
  const { sitegroup, clog = console.log } = args;

  const query = gql`
    query querySites($sitegroup: String!) {
      siteGroupByName(name: $sitegroup) {
        gitUrl
        sites(first: 1000) {
          edges {
            node {
              siteName
              siteBranch
              siteEnvironment
            }
          }
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
    return exitGraphQLError(clog, errors);
  }

  const sortBySite = sortBy(compose(toLower, propOr('', 'siteName')));

  const nodes = compose(
    sortBySite,
    map(edge => prop('node', edge)),
    pathOr([], ['data', 'siteGroupByName', 'sites', 'edges']),
  )(result);

  if (nodes.length === 0) {
    clog(red(`No sites found for sitegroup '${sitegroup}'`));
    return 0;
  }

  clog(`I found following sites for sitegroup '${sitegroup}':`);

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

  const tableBody = map(node => {
    const inProdMarker = node.siteEnvironment === 'production' ? '\u221A' : '';
    return [node.siteName, node.siteBranch, inProdMarker];
  }, nodes);

  const tableData = prepend(['Site', 'Branch', 'Deployed?'], tableBody);

  clog(table(tableData, tableConfig));

  return 0;
}

export default {
  setup,
  name,
  description,
  run,
};
