// @flow

import R from 'ramda';
import format from '../util/format';
import gql from '../util/gql';
import { queryGraphQL } from '../util/queryGraphQL';
import {
  printGraphQLErrors,
  printProjectConfigurationError,
} from '../util/printErrors';

import typeof Yargs from 'yargs';
import type { CommandHandlerArgsWithOptions } from '../types/Command';

export const command = 'environments';
export const description = 'Show environment details for a given project';

const PROJECT: 'project' = 'project';

export const commandOptions = {
  [PROJECT]: PROJECT,
};

export function builder(yargs: Yargs): Yargs {
  return yargs
    .usage(`$0 ${command} - ${description}`)
    .options({
      [PROJECT]: {
        demandOption: false,
        describe: 'Name of project',
        type: 'string',
      },
    })
    .example(
      `$0 ${command}`,
      'Show environments for the project configured in .lagoon.yml',
    )
    .example(
      `$0 ${command} --${PROJECT} myproject`,
      'Show environments of project "myproject"',
    );
}

type Args = CommandHandlerArgsWithOptions<{
  +project?: string,
}>;

export async function handler({
  options: { project: projectName },
  clog,
  cerr,
}:
Args): Promise<number> {
  if (projectName == null) {
    return printProjectConfigurationError(cerr);
  }

  const result = await queryGraphQL({
    cerr,
    query: gql`
      query ProjectByName($project: String!) {
        projectByName(name: $project) {
          environments {
            name
            environment_type
            deploy_type
            created
            updated
          }
        }
      }
    `,
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

  const environments = R.path(['environments'])(project);

  if (environments == null) {
    clog(`No environments for project '${projectName}' found.`);
    return 0;
  }

  clog(
    format([
      ['Name', 'Environment Type', 'Deploy Type', 'Created', 'Updated'],
      ...R.map(
        environment => [
          environment.name,
          environment.environment_type,
          environment.deploy_type,
          environment.created,
          environment.updated,
        ],
        environments,
      ),
    ]),
  );

  return 0;
}
