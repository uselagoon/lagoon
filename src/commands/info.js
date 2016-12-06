// @flow

/* eslint-disable no-console */

import { table } from 'table';
import { red } from 'chalk';
import {
  path,
  pathOr,
  prop,
  forEach,
  map,
  join,
  compose,
  filter,
} from 'ramda';

import gql from '../gql';
import { runGQLQuery } from '../query';
import { exitNoConfig } from '../exit';

import typeof { default as Yargs } from 'yargs';
import type { BaseArgs } from './index';

const name = 'info';
const description = 'Shows infos about given site';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs
    .usage(`$0 ${name} [site@branch] - ${description}`)
    .options({
      sitegroup: {
        demand: false,
        describe: 'Overrides the currently configured sitegroup (.amazeeio.yml)',
        type: 'string',
      },
    })
    .alias('s', 'sitegroup')
    .example(`$0 ${name} info mysite`, 'Shows information about given site "mysite" (does only work with single branch)')
    .example(`$0 ${name} info mysite@prod`, 'Shows information about given site "mysite" with branch "prod" (sitegroup as stated by config)')
    .example(`$0 ${name} info -s mysitegroup mysite`, 'Shows information about given site "mysite" in given sitegroup "somesitegroup"')
    .argv;
}

type Args = BaseArgs & {
  sitegroup: ?string,
};

export async function run(args: Args): Promise<number> {
  const { config, clog = console.log } = args;

  if (config == null) {
    return exitNoConfig(clog);
  }

  const [siteAndBranch] = args._.slice(1);
  const sitegroup = args.sitegroup || config.sitegroup;

  const [site, branch] = siteAndBranch.split('@');

  return siteInfo({
    site,
    branch,
    sitegroup,
    clog,
  });
}

type MainArgs = {
  site: string,
  branch?: string,
  sitegroup: string,
  clog?: typeof console.log,
};

export async function siteInfo(args: MainArgs): Promise<number> {
  const {
    sitegroup,
    site,
    branch,
    clog = console.log,
  } = args;

  // site[@branch]
  const siteBranchStr = `${site}${branch != null ? `@${branch}` : ''}`;

  const query = gql`query querySites($sitegroup: String!) {
    siteGroupByName(name: $sitegroup) {
      gitUrl
      sites(first: 1000) {
        edges {
          node {
            id
            siteHost
            siteName
            siteBranch
            siteEnvironment
            serverInfrastructure
            serverIdentifier
            serverNames
            webRoot
            drupalVersion
            SSLCertificateType
            FPMProfile
            domains
            redirectDomains
            redirects
            uid
            dbUser
            cron { type minute }
            customCron
            envVariables
            noPrefixenvVariables
            phpValues
            phpAdminFlags
            xdebug
            nginxSitespecific
            nginxSiteconfig
            solrEnabled
            redisEnabled
            sshKeys
            phpVersion
            redirectToHttps
            ensure
            upstreamURL
            apc
            basicAuth {
              username
            }
            fullJson
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

  // There might be a case where I just have one site + branch,
  // so we will just filter for branch, if a branch was actually
  // given. If there are multiple matches, we will tell the user
  // anyways
  const matchesSiteAndBranch = ({ siteName, siteBranch }) => {
    if (branch != null && siteBranch !== branch) {
      return false;
    }
    return siteName === site;
  };

  const nodes =
    compose(
      filter(matchesSiteAndBranch),
      map((edge) => prop('node', edge)),
      pathOr([], ['data', 'siteGroupByName', 'sites', 'edges'])
    )(result);

  if (nodes.length === 0) {
    clog(red(`No site '${site}' found in sitegroup '${sitegroup}'`));
    return 0;
  }

  // For the case if there was no branch name given to begin with
  if (nodes.length > 1) {
    clog('I found multiple sites with the same name, but different branches, maybe try following parameter...');
    forEach(({ siteName, siteBranch }) => clog(`-> ${siteName}@${siteBranch}`))(nodes);
    return 0;
  }

  clog(`I found following information for '${sitegroup} -> ${siteBranchStr}':`);

  const tableConfig = {
    columns: {
      '0': { // eslint-disable-line quote-props
        alignment: 'left',
        minWidth: 15,
      },
      '1': { // eslint-disable-line quote-props
        alignment: 'left',
        minWidth: 15,
      },
    },
  };

  // nodes only contains one element, extract it
  const [node] = nodes;

  const formatCron = (cron) => {
    if (cron == null) {
      return null;
    }

    return `Type: ${cron.type} - Minute: ${cron.minute}`;
  };

  const formatArray = (arr) => {
    if (arr == null) {
      return null;
    }

    return join(', ', arr);
  };

  const onlyValues = ([title, value]: [string, string]) => value != null && value !== '';

  // We want to list these fields from the node result
  const tableBody = [
    ['ID', path(['id'], node)],
    ['Site Name', path(['siteName'], node)],
    ['Site Branch', path(['siteBranch'], node)],
    ['Site Env', path(['siteEnvironment'], node)],
    ['User Id', path(['uid'], node)],
    ['Server Names', path(['serverNames'], node)],
    ['Webroot', path(['webRoot'], node)],
    ['Domains', formatArray(path(['domains'], node))],
    ['Redirect Domains', formatArray(path(['redirectDomains'], node))],
    ['SSL Certificate Type', path(['SSLCertificateType'], node)],
    ['Cron', formatCron(path(['cron'], node))],
    ['Solr Enabled', path(['solrEnabled'], node)],
  ];

  const tableData = filter(onlyValues)(tableBody);

  clog(table(tableData, tableConfig));

  return 0;
}

export default {
  setup,
  name,
  description,
  run,
};
