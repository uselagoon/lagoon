// @flow

import { table } from 'table';
import R from 'ramda';

import gql from '../gql';
import { runGQLQuery } from '../query';
import {
  printErrors,
  printNoConfigError,
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

const name = 'sitegroup';
const description = 'Show sitegroup info';

export function setup(yargs: Yargs) {
  return yargs
    .usage(`$0 ${name} [sitegroup] - ${description}`)
    .example(
      `$0 ${name}`,
      'Show information about the sitegroup configured in .lagoon.yml',
    )
    .example(
      `$0 ${name} mysitegroup`,
      'Show information about sitegroup "mysitegroup"',
    );
}

type SiteGroupInfoArgs = {
  sitegroup: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function sitegroupInfo({
  sitegroup,
  clog,
  cerr,
}: SiteGroupInfoArgs): Promise<number> {
  const query = gql`
    query querySites($sitegroup: String!) {
      projectByName(name: $sitegroup) {
        git_url
        name
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

  const sitegroupData = R.path(['data', 'projectByName'])(result);

  if (sitegroupData == null) {
    return printErrors(clog, `No sitegroup '${sitegroup}' found`);
  }

  const sites = R.compose(
    R.map(({ siteName, siteBranch }) => `${siteName}:${siteBranch}`),
    R.pathOr([], ['data', 'projectByName', 'sites']),
  )(result);

  const formatSlack = (slack) => {
    if (slack == null) {
      return '';
    }

    const webhook = R.prop('webhook', slack);
    const channel = R.prop('channel', slack);

    return `${channel} -> ${webhook}`;
  };

  const tableBody = [
    ['Project Name', R.prop('name', sitegroupData)],
    ['Git Url', R.prop('git_url', sitegroupData)],
    // ['Slack', formatSlack(R.prop('slack', sitegroupData))],
    // ['Sites', R.join(', ', sites)],
  ];

  const tableData = R.filter(onlyValues)(tableBody);

  clog(`Details for '${sitegroup}':`);
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

  const sitegroup = R.head(args._.slice(1)) || config.sitegroup;

  if (sitegroup == null) {
    return printErrors(
      cerr,
      'No sitegroup configured. Please create a .lagoon.yml config file with "io init" or pass a sitegroup to this command via the first argument.\nOnline documentation: https://github.com/lagoon/lagoon/blob/master/cli/README.md#io-init',
    );
  }

  return sitegroupInfo({ sitegroup, clog, cerr });
}

export default {
  setup,
  name,
  description,
  run,
};
