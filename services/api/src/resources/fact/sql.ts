// @flow

import { knex } from '../../util/db';

/* ::

import type {SqlObj} from '../';

*/

const standardFactReturn = {
    id: 'id',
    environment: 'environment',
    name: 'name',
    value: 'value',
    created: 'created',
};

export const Sql /* : SqlObj */ = {
  selectFactByDatabaseId: (id) =>
    knex('environment_fact').where('id', id).toString(),
  selectFactsByEnvironmentId: ({
    environmentId,
  }) => {
    return knex('environment_fact').select(standardFactReturn).where('environment', environmentId).toString();
  },
  insertFact: ({environment, name, value}) =>
    knex('environment_fact').insert({environment, name, value}).toString(),
  deleteFact: (environment, name) =>
    knex('environment_fact')
      .where({
        environment,
        name
      }).del().toString(),
};
