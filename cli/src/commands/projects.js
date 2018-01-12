// @flow

import { table } from 'table';
import { red } from 'chalk';
import R from 'ramda';

import gql from '../gql';
import { runGQLQuery } from '../query';
import { printGraphQLErrors } from '../printErrors';

import typeof Yargs from 'yargs';
import type { BaseArgs } from '.';

const name = 'projects';
const description = 'List all projects';

export function setup(yargs: Yargs) {
  return yargs
    .usage(`$0 ${name} - ${description}`)
    .example('$0', 'List all projects');
}

type ListProjectsArgs = {
  clog: typeof console.log,
  cerr: typeof console.error,
};

export async function listProjects({
  clog,
  cerr,
}: 
ListProjectsArgs): Promise<number> {
  const query = gql`
    query queryProjects {
      allProjects {
        name
        git_url
        branches
        pullrequests
        created
      }
    }
  `;

  const result = await runGQLQuery({
    cerr,
    query,
  });

  const { errors } = result;

  if (errors != null) {
    return printGraphQLErrors(cerr, ...errors);
  }

  const sortByName = R.sortBy(R.compose(R.toLower, R.propOr('', 'name')));

  const projects = R.compose(sortByName, R.pathOr([], ['data', 'allProjects']))(result);

  if (projects.length === 0) {
    clog(red('No projects found.'));
    return 0;
  }

  clog(table([
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
  ]));

  return 0;
}

export async function run({ clog, cerr }: BaseArgs): Promise<number> {
  return listProjects({ clog, cerr });
}

export default {
  setup,
  name,
  description,
  run,
};
