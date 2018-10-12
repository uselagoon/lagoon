// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  updateOpenshift: (
    { id, patch } /* : {id: number, patch: {[string]: any}} */,
  ) =>
    knex('openshift')
      .where('id', '=', id)
      .update(patch)
      .toString(),
  selectOpenshift: (id /* : number */) =>
    knex('openshift')
      .where('id', '=', id)
      .toString(),
  truncateOpenshift: () =>
    knex('openshift')
      .truncate()
      .toString(),
};

module.exports = Sql;
