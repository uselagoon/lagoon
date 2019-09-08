// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  selectDeployment: (id /* : number */) =>
    knex('deployment')
      .where('id', '=', id)
      .toString(),
  insertDeployment: (
    {
      id,
      name,
      status,
      created,
      started,
      completed,
      environment,
      remoteId,
    } /* : {
    id: number,
    name: string,
    status: string,
    created: number,
    started: number,
    completed: number,
    environment: string,
    remoteId: number,
  } */,
  ) =>
    knex('deployment')
      .insert({
        id,
        name,
        status,
        created,
        started,
        completed,
        environment,
        remoteId,
      })
      .toString(),
  deleteDeployment: (id /* : number */) =>
    knex('deployment')
      .where('id', id)
      .del()
      .toString(),
  updateDeployment: ({ id, patch } /* : {id: number, patch: Object} */) =>
    knex('deployment')
      .where('id', id)
      .update(patch)
      .toString(),
  selectPermsForDeployment: (id /* : number */) =>
    knex('deployment')
      .select({ pid: 'project.id' })
      .join('environment', 'deployment.environment', '=', 'environment.id')
      .join('project', 'environment.project', '=', 'project.id')
      .where('deployment.id', id)
      .toString(),
  selectPermsForEnvironment: (id /* : number */) =>
    knex('environment')
      .select({ pid: 'project.id' })
      .join('project', 'environment.project', '=', 'project.id')
      .where('environment.id', id)
      .toString(),
};

module.exports = Sql;
