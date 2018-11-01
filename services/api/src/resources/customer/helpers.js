// @flow

const R = require('ramda');
const sqlClient = require('../../clients/sqlClient');
const { query } = require('../../util/db');
const Sql = require('./sql');

const Helpers = {
  getCustomerById: async (id /* : number */) => {
    const rows = await query(sqlClient, Sql.selectCustomer(id));
    return R.prop(0, rows);
  },
  getCustomerIdByName: async (name /* : string */) => {
    const cidResult = await query(sqlClient, Sql.selectCustomerIdByName(name));

    const amount = R.length(cidResult);
    if (amount > 1) {
      throw new Error(
        `Multiple customer candidates for '${name}' (${amount} found). Do nothing.`,
      );
    }

    if (amount === 0) {
      throw new Error(`Not found: '${name}'`);
    }

    const cid = R.path(['0', 'id'], cidResult);

    return cid;
  },
  getAllCustomerIds: async () =>
    R.map(R.prop('id'), await query(sqlClient, Sql.selectAllCustomerIds())),
  getAllCustomerNames: async () =>
    R.map(R.prop('name'), await query(sqlClient, Sql.selectAllCustomerNames())),
  getAllCustomers: async () => query(sqlClient, Sql.selectAllCustomers()),
  filterRestrictedData: (creds, rows) => rows.map(row => {
    const { role } = creds;
    let privateKey = row.privateKey;

    if (role !== 'admin') {
      privateKey = null;
    }

    return {
      ...row,
      privateKey,
    };
  }),
};

module.exports = Helpers;
