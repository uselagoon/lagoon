// @flow

/* eslint-disable no-console */

import { red } from 'chalk';
import { pathOr, prop, forEach, map, compose } from 'ramda';

import gql from '../gql';
import { runGQLQuery } from '../query';

import typeof { default as Yargs } from 'yargs';
import type { BaseArgs } from './index';

const name = 'list';
const description = 'Lists specific deployment information';

export async function setup(yargs: Yargs) {
  return yargs
    .usage(`$0 ${name} [target] - ${description}`)
    .options({
      sitegroup: {
        alias: 's',
        demand: false,
        describe: 'Overrides the currently configured sitegroup (.amazeeio.yml)',
      },
    })
    .example(`$0 ${name} sites`, 'Lists all sites for the specific sitegroup configured in your .amazeeio.yml config file')
    .example(`$0 ${name} sites -s mysitegroup`, 'Lists all sites for a specific sitegroup (instead of using the config file)')
    .argv;
}

function errorWithMessage(message: string, code?: number = 1): number {
  console.log(message);
  return code;
}

type Target = 'sites';

type Args = BaseArgs & {
  sitegroup: ?string,
  target: Target,
};

export async function run(args: Args): Promise<number> {
  const [target] = args._.slice(1);
  const sitegroup = args.sitegroup || args.config.sitegroup;

  switch (target) {
    case 'sites': return listSites({ sitegroup });
    default: return errorWithMessage(`Unknown target ${target}`, 1);
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

  const nodes =
    compose(
      map((edge) => prop('node', edge)),
      pathOr([], ['data', 'siteGroupByName', 'sites', 'edges'])
    )(result);

  if (nodes.length === 0) {
    clog(red(`No sites found for sitegroup '${sitegroup}'`));
    return 0;
  }

  clog(`I found following sites for sitegroup '${sitegroup}'`);

  forEach((node) => {
    clog(`|- ${node.siteName}`);
  }, nodes);

  return 0;
}

export default {
  name,
  description,
  run,
};
