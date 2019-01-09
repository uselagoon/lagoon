// @flow

const R = require('ramda');
const sqlClient = require('../../clients/sqlClient');
const { query } = require('../../util/db');
const Sql = require('./sql');

const Helpers = {
  getEnvironmentById: async (environmentID /* : number */) => {
    const rows = await query(sqlClient, Sql.selectEnvironmentById(environmentID));
    return R.prop(0, rows);
  },
};

module.exports = Helpers;
