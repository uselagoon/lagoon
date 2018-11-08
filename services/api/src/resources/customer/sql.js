// @flow

const R = require('ramda');
const { knex } = require('../../util/db');

/* ::

import type {Cred, SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  updateCustomer: (
    { role, permissions: { customers } } /* : Cred */,
    { id, patch } /* : {id : number, patch: Object} */,
  ) => {
    const updateCustomerQuery = knex('customer').where('id', '=', id);

    if (role !== 'admin' && !R.contains(id, customers)) {
      updateCustomerQuery.whereIn('id', customers);
    }

    return updateCustomerQuery.update(patch).toString();
  },
  selectCustomer: (id /* : number */) =>
    knex('customer')
      .where('id', id)
      .toString(),
  selectCustomerByName: (
    { role, permissions: { customers } } /* : Cred */,
    name /* : string */,
  ) => {
    const getCustomerQuery = knex('customer').where('name', '=', name);

    if (role !== 'admin') {
      getCustomerQuery.whereIn('id', customers);
    }

    return getCustomerQuery.toString();
  },
  selectCustomerIdByName: (name /* : string */) =>
    knex('customer')
      .where('name', '=', name)
      .select('id')
      .toString(),
  selectAllCustomerIds: () =>
    knex('customer')
      .select('id')
      .toString(),
  selectAllCustomerNames: () =>
    knex('customer')
      .select('name')
      .toString(),
  selectAllCustomers: () =>
    knex('customer')
      .toString(),
  truncateCustomer: () =>
    knex('customer')
      .truncate()
      .toString(),
};

module.exports = Sql;
