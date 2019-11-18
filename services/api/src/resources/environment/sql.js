// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  updateEnvironment: ({ id, patch } /* : {id: number, patch: Object} */) =>
    knex('environment')
      .where('id', '=', id)
      .update(patch)
      .toString(),
  selectEnvironmentById: (id /* : number */) =>
    knex('environment')
      .where('id', '=', id)
      .toString(),
  selectEnvironmentByNameAndProject: (name /* : string */, projectId /* : numbere */) =>
    knex('environment')
      .where('name', '=', name)
      .andWhere('project', '=', projectId)
      .toString(),
  truncateEnvironment: () =>
    knex('environment')
      .truncate()
      .toString(),
  selectPermsForEnvironment: (id /* : number */) =>
    knex('environment')
      .select({ pid: 'project.id' })
      .join('project', 'environment.project', '=', 'project.id')
      .where('environment.id', id)
      .toString(),
  insertService: (
    environment /* : number */,
    name /* : string */,
  ) =>
    knex('environment_service')
      .insert({
        environment,
        name,
      })
      .toString(),
  selectServicesByEnvironmentId: (id /* : number */) =>
    knex('environment_service')
      .where('environment', '=', id)
      .toString(),
  deleteServices: (id /* : number */) =>
    knex('environment_service')
      .where('environment', '=', id)
      .delete()
      .toString(),
};

module.exports = Sql;
