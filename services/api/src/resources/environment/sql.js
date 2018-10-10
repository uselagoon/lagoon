// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  updateEnvironment: ({ id, patch } /* : {id: number, patch: Object} */) => knex('environment')
    .where('id', '=', id)
    .update(patch)
    .toString(),
  selectEnvironmentById: (id /* : number */) =>
    knex('environment')
      .where('id', '=', id)
      .toString(),
  truncateEnvironment: () =>
    knex('environment')
      .truncate()
      .toString(),
};

module.exports = Sql;
