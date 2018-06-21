// @flow

import { table } from 'table';
import R from 'ramda';

import { visit } from '../cli/visit';
import { config } from '../config';
import gql from '../gql';
import { runGQLQuery } from '../query';
import {
  printGraphQLErrors,
  printProjectConfigurationError,
} from '../printErrors';

import typeof Yargs from 'yargs';
import type { BaseHandlerArgs } from '.';

export const command = 'project';
export const description = 'Show project details';

export function builder(yargs: Yargs): Yargs {
  return yargs
    .usage(`$0 ${command} - ${description}`)
    .options({
      project: {
        demandOption: false,
        describe: 'Name of project',
        type: 'string',
      },
    })
    .alias('p', 'project')
    .example(
      `$0 ${command}`,
      'Show details for the project configured in .lagoon.yml',
    )
    .example(`$0 ${command} myproject`, 'Show details of project "myproject"')
    .commandDir('projectCommands', { visit });
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
    query ProjectByName($project: String!) {
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
    clog(`No project '${projectName}' found.`);
    return 0;
  }

  clog(`Project details for '${projectName}':`);
  clog(
    table([
      ['Project Name', R.prop('name', project)],
      ['Customer', R.path(['customer', 'name'], project)],
      ['Git URL', R.prop('git_url', project)],
      ['Active Systems Deploy', R.prop('active_systems_deploy', project)],
      ['Active Systems Remove', R.prop('active_systems_remove', project)],
      ['Branches', String(R.prop('branches', project))],
      ['Pull Requests', String(R.prop('pullrequests', project))],
      ['Openshift', R.path(['openshift', 'name'], project)],
      ['Created', R.path(['created'], project)],
    ]),
  );

  return 0;
}

type Args = BaseHandlerArgs & {
  argv: {
    project: ?string,
  },
};

export async function handler({ clog, cerr, argv }: Args): Promise<number> {
  const projectName = R.prop('project', argv) || R.prop('project', config);

  if (projectName == null) {
    return printProjectConfigurationError(cerr);
  }

  return projectDetails({ projectName, clog, cerr });
}
