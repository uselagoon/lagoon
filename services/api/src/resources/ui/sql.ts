import { KnownDirectives } from 'graphql/validation/rules/KnownDirectives';
import { knex } from '../../util/db';

// We only want to return limit values from the Project for now such as 'id' and 'name'
const uiProjectReturn = {
    id: 'p.id',
    name: 'p.name',
};

export const Sql = {
  selectProjectsByIdsAndFilter: (
    projectIds: number[],
    limit: number = 0,
    skip: number = 0,
  ) => {
    let q =  knex('project as p')
      .distinct(uiProjectReturn)

    if (limit) {
      q.limit(limit);
    }

    if (skip) {
      q.offset(skip);
    }

    return q.orderBy('p.name', 'asc').toString()
  }
};
