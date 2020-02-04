// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  selectEnvVariable: (id /* : number */) =>
    knex('env_vars')
      .select('id', 'name', 'value', 'scope')
      .where('id', '=', id)
      .toString(),
  insertEnvVariable: (
    {
      id,
      name,
      value,
      scope,
      project,
      environment,
    } /* : {
    id: number,
    name: string,
    value: string,
    scope: string,
    project: ?number,
    environment: ?number,
  } */,
  ) =>
    knex('env_vars')
      .insert({
        id,
        name,
        value,
        scope,
        project,
        environment,
      })
      .toString(),
  deleteEnvVariable: (id /* : number */) =>
    knex('env_vars')
      .where('id', id)
      .del()
      .toString(),
  selectPermsForEnvVariable: (id /* : number */) =>
    knex('env_vars')
      .select({ pid: 'project.id' })
      .leftJoin('environment', 'env_vars.environment', '=', 'environment.id')
      .leftJoin('project', 'env_vars.project', '=', 'project.id')
      .where('env_vars.id', id)
      .toString(),
};

module.exports = Sql;
