// @flow

/* eslint-disable no-console */

import { red } from 'chalk';
import {
  init,
  last,
  tail,
  keys,
  pathOr,
  prop,
  forEach,
  map,
  compose,
  sortBy,
  groupBy,
  toLower,
} from 'ramda';
import { exitNoConfig, exitError } from '../exit';

import gql from '../gql';
import { runGQLQuery } from '../query';

import typeof { default as Yargs } from 'yargs';
import type { BaseArgs } from './index';

const name = 'list';
const description = 'Lists specific deployment information';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs
    .usage(`$0 ${name} [target] - ${description}`)
    .options({
      sitegroup: {
        demand: false,
        describe: 'Overrides the currently configured sitegroup (.amazeeio.yml)',
        type: 'string',
      },
    })
    .alias('s', 'sitegroup')
    .example(`$0 ${name} sites`, 'Lists all sites for the specific sitegroup configured in your .amazeeio.yml config file')
    .example(`$0 ${name} sites -s mysitegroup`, 'Lists all sites for a specific sitegroup (instead of using the config file)')
    .argv;
}

type Target = 'sites';

type Args = BaseArgs & {
  sitegroup: ?string,
  target: Target,
};

export async function run(args: Args): Promise<number> {
  const { config, clog } = args;

  if (config == null) {
    return exitNoConfig(clog);
  }

  const [target] = args._.slice(1);
  const sitegroup = args.sitegroup || config.sitegroup;

  switch (target) {
    case 'sites': return listSites({ sitegroup });
    default: return exitError(clog, `Unknown target ${target} ... possible values: 'sites'`, 1);
  }
}

type MainArgs = {
  sitegroup: string,
  clog?: typeof console.log,
};

export async function listSites(args: MainArgs): Promise<number> {
  const {
    sitegroup,
    clog = console.log,
  } = args;

  const query = gql`query querySites($sitegroup: String!) {
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
  }`;

  const result = await runGQLQuery({
    endpoint: 'https://amazeeio-api-staging.herokuapp.com/graphql',
    query,
    variables: { sitegroup },
  });

  if (result.errors != null) {
    clog(red('Oops! Server sent us some errors:'));
    forEach(({ message }) => clog(`-> ${message}`), result.errors);
    return 1;
  }

  const sortBySite = sortBy(compose(toLower, prop('siteName')));

  const nodesBySite =
    compose(
      groupBy((node) => node.siteName),
      sortBySite,
      map((edge) => prop('node', edge)),
      pathOr([], ['data', 'siteGroupByName', 'sites', 'edges'])
    )(result);

  const sites = keys(nodesBySite);

  if (sites.length === 0) {
    clog(red(`No sites found for sitegroup '${sitegroup}'`));
    return 0;
  }

  clog(`I found following sites for sitegroup '${sitegroup}':`);

  const renderSiteGroup = (site, sep: string) => {
    const nodes = nodesBySite[site];
    clog(`${sep} ${site}`);

    const inProdMarker = (node) => node.siteEnvironment === 'production' ? '*' : '';
    const renderSite = (node, sep) => clog(`|   ${sep} ${node.siteBranch}${inProdMarker(node)}`);

    forEach((node) => renderSite(node, '├──'), init(nodes));
    forEach((node) => renderSite(node, '└──'), tail(nodes));
  };

  forEach((site) => renderSiteGroup(site, '├─'), init(sites));
  forEach((site) => renderSiteGroup(site, '└─'), [last(sites)]);

  return 0;
}

export default {
  setup,
  name,
  description,
  run,
};
