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
    knex('ev')
      .select({ pid: 'project.id', cid: 'project.customer' })
      .leftJoin('environment', 'ev.environment', '=', 'environment.id')
      .leftJoin('project', 'ev.project', '=', 'project.id')
      .where('ev.id', id)
      .toString(),
  selectPermsForProject: (id /* : number */) =>
    knex('project')
      .select({ pid: 'id', cid: 'customer' })
      .where('id', id)
      .toString(),
  selectPermsForEnvironment: (id /* : number */) =>
    knex('environment')
      .select({ pid: 'project.id', cid: 'project.customer' })
      .join('project', 'environment.project', '=', 'project.id')
      .where('environment.id', id)
      .toString(),
};

module.exports = Sql;
