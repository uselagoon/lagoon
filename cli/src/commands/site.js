// @flow

import { table } from 'table';
import { red } from 'chalk';
import R from 'ramda';

import gql from '../gql';
import { runGQLQuery } from '../query';
import {
  printErrors,
  printNoConfigError,
  printSitegroupConfigurationError,
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

const name = 'site';
const description = 'Show site information for a sitegroup';

export async function setup(yargs: Yargs): Promise<Object> {
  return yargs
    .usage(`$0 ${name} [site@branch] - ${description}`)
    .options({
      sitegroup: {
        demandOption: false,
        describe: 'Specify a sitegroup for the site information',
        type: 'string',
      },
    })
    .alias('s', 'sitegroup')
    .example(
      `$0 ${name} mysite`,
      'Show information about site "mysite" (only works if the site only has a single branch) (sitegroup as stated by config)',
    )
    .example(
      `$0 ${name} mysite@prod`,
      'Show information about branch "prod" of site "mysite" (sitegroup as stated by config)',
    )
    .example(
      `$0 ${name} -s mysitegroup mysite`,
      'Show information about site "mysite" in sitegroup "somesitegroup"',
    ).argv;
}

type SiteInfoArgs = {
  site: string,
  branch?: string,
  sitegroup: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function siteInfo({
  sitegroup,
  site,
  branch,
  clog,
  cerr,
}: SiteInfoArgs): Promise<number> {
  // site[@branch]
  const siteBranchStr = `${site}${branch != null ? `@${branch}` : ''}`;

  const query = gql`
    query querySites($sitegroup: String!) {
      siteGroupByName(name: $sitegroup) {
        gitUrl
        sites {
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
          cron {
            type
            minute
          }
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

  const nodes = R.compose(
    R.filter(matchesSiteAndBranch),
    R.pathOr([], ['data', 'siteGroupByName', 'sites']),
  )(result);

  if (nodes.length === 0) {
    clog(red(`No site '${site}' found in sitegroup '${sitegroup}'`));
    return 0;
  }

  // For the case if there was no branch name given to begin with
  if (nodes.length > 1) {
    clog(
      'Multiple sites found with the same name but different branches. The branch can be specified with the "siteName@siteBranch" syntax. For example:',
    );
    R.forEach(({ siteName, siteBranch }) =>
      clog(`-> ${siteName}@${siteBranch}`),
    )(nodes);
    return 0;
  }

  clog(`Details for '${sitegroup} -> ${siteBranchStr}':`);

  // nodes only contains one element, extract it
  const [node] = nodes;

  const formatCron = (cron) => {
    if (cron == null) {
      return '';
    }

    return `Type: ${cron.type} - Minute: ${cron.minute}`;
  };

  const formatArray = (arr) => {
    if (arr == null) {
      return '';
    }

    return R.join(', ', arr);
  };

  // We want to list these fields from the node result
  const tableBody = [
    ['ID', R.prop('id', node)],
    ['Site Name', R.prop('siteName', node)],
    ['Site Branch', R.prop('siteBranch', node)],
    ['Site Env', R.prop('siteEnvironment', node)],
    ['User Id', R.prop('uid', node)],
    ['Server Names', R.prop('serverNames', node)],
    ['Webroot', R.prop('webRoot', node)],
    ['Domains', formatArray(R.prop('domains', node))],
    ['Redirect Domains', formatArray(R.prop('redirectDomains', node))],
    ['SSL Certificate Type', R.prop('SSLCertificateType', node)],
    ['Cron', formatCron(R.prop('cron', node))],
    ['Solr Enabled', R.prop('solrEnabled', node)],
  ];

  const tableData = R.filter(onlyValues)(tableBody);

  clog(table(tableData, tableConfig));

  return 0;
}

type Args = BaseArgs & {
  sitegroup: ?string,
};

export async function run(args: Args): Promise<number> {
  const { config, clog, cerr } = args;

  if (config == null) {
    return printNoConfigError(cerr);
  }

  const [siteAndBranch] = args._.slice(1);

  if (siteAndBranch == null) {
    return printErrors(
      cerr,
      'Site name not specified. Please pass the site name as the first argument.',
    );
  }

  const sitegroup = args.sitegroup || config.sitegroup;

  if (sitegroup == null) {
    return printSitegroupConfigurationError(cerr);
  }

  const [site, branch] = siteAndBranch.split('@');

  return siteInfo({
    site,
    branch,
    sitegroup,
    clog,
    cerr,
  });
}

export default {
  setup,
  name,
  description,
  run,
};
