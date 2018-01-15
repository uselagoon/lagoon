// @flow

import { table } from 'table';
import R from 'ramda';

import gql from '../gql';
import { runGQLQuery } from '../query';
import {
  printErrors,
  printGraphQLErrors,
  printNoConfigError,
  printProjectConfigurationError,
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

const name = 'project';
const description = 'Show project details';

export function setup(yargs: Yargs): Yargs {
  return yargs
    .usage(`$0 ${name} - ${description}`)
    .options({
      project: {
        demandOption: false,
        describe: 'Name of project to display details',
        type: 'string',
      },
    })
    .alias('p', 'project')
    .example(
      `$0 ${name}`,
      'Show details for the project configured in .lagoon.yml',
    )
    .example(`$0 ${name} myproject`, 'Show details of project "myproject"');
}

type projectDetailsArgs = {
  projectName: string,
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function projectDetails({
  projectName,
  clog,
  cerr,
}:
projectDetailsArgs): Promise<number> {
  const query = gql`
    query queryProject($project: String!) {
      projectByName(name: $project) {
        name
        customer {
          name
        }
        git_url
        active_systems_deploy
        active_systems_remove
        branches
        pullrequests
        openshift {
          name
        }
        created
      }
    }
  `;

  const result = await runGQLQuery({
    cerr,
    query,
    variables: { project: projectName },
  });

  const { errors } = result;
  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  const project = R.path(['data', 'projectByName'])(result);

  if (project == null) {
    return printErrors(clog, `No project '${projectName}' found`);
  }

  const tableBody = [
    ['Project Name', R.prop('name', project)],
    ['Customer', R.path(['customer', 'name'], project)],
    ['Git URL', R.prop('git_url', project)],
    ['Active Systems Deploy', R.prop('active_systems_deploy', project)],
    ['Active Systems Remove', R.prop('active_systems_remove', project)],
    ['Branches', String(R.prop('branches', project))],
    ['Pull Requests', String(R.prop('pullrequests', project))],
    ['Openshift', R.path(['openshift', 'name'], project)],
    ['Created', R.path(['created'], project)],
  ];

  const tableData = R.filter(onlyValues)(tableBody);

  clog(`Project details for '${projectName}':`);
  clog(table(tableData, tableConfig));

  return 0;
}

type Args = BaseArgs & {
  name: ?string,
};

export async function run({
  clog,
  cerr,
  config,
  project: projectOption,
}:
Args): Promise<number> {
  if (config == null) {
    return printNoConfigError(cerr);
  }

  const projectName = projectOption || config.project;

  if (projectName == null) {
    return printProjectConfigurationError(cerr);
  }

  return projectDetails({ projectName, clog, cerr });
}

export default {
  setup,
  name,
  description,
  run,
};
