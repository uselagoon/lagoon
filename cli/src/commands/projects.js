// @flow

import { table } from 'table';
import R from 'ramda';

import gql from '../util/gql';
import { queryGraphQL } from '../util/queryGraphQL';
import { printGraphQLErrors } from '../util/printErrors';

import typeof Yargs from 'yargs';
import type { CommandHandlerArgs } from '../types/Command';

export const command = 'projects';
export const description = 'List all projects';

export function builder(yargs: Yargs) {
  return yargs
    .usage(`$0 ${command} - ${description}`)
    .example(`$0 ${command}`, 'List all projects');
}

export async function handler({
  clog,
  cerr,
}:
CommandHandlerArgs): Promise<number> {
  const query = gql`
    query AllProjects {
      allProjects {
        name
        git_url
        branches
        pullrequests
        created
      }
    }
  `;

  const result = await queryGraphQL({
    cerr,
    query,
  });

  const { errors } = result;
  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  const sortByName = R.sortBy(
    R.compose(
      R.toLower,
      R.propOr('', 'name'),
    ),
  );

  const projects = R.compose(
    sortByName,
    R.pathOr([], ['data', 'allProjects']),
  )(result);

  if (projects.length === 0) {
    clog('No projects found.');
    return 0;
  }

  clog(
    table([
      ['Project', 'Git URL', 'Branches', 'Pull Requests', 'Created'],
      ...R.map(
        project => [
          project.name,
          project.git_url,
          String(project.branches),
          String(project.pullrequests),
          project.created,
        ],
        projects,
      ),
    ]),
  );

  return 0;
}
