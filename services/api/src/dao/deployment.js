// @flow

const R = require('ramda');
const {
  ifNotAdmin,
  inClauseOr,
  prepare,
  query,
} = require('./utils');

const Sql = {};

const Helpers = {};

const getDeploymentsByEnvironmentId = ({ sqlClient }) => async (cred, eid) => {
  const { customers, projects } = cred.permissions;
  const prep = prepare(
    sqlClient,
    `SELECT
        d.*
      FROM environment e
      JOIN deployment d on e.id = d.environment
      JOIN project p ON e.project = p.id
      WHERE e.id = :eid
      ${ifNotAdmin(
    cred.role,
    `AND (${inClauseOr([
      ['p.customer', customers],
      ['p.id', projects],
    ])})`,
  )}
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));

  return rows;
};

const Queries = {
  getDeploymentsByEnvironmentId,
};

module.exports = {
  Sql,
  Queries,
  Helpers,
};
