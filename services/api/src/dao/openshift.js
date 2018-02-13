const R = require('ramda');
const attrFilter = require('./attrFilter');
const {
  knex,
  ifNotAdmin,
  whereAnd,
  inClause,
  inClauseOr,
  query,
  prepare,
} = require('./utils');

const addOpenshift = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }
  const prep = prepare(
    sqlClient,
    `CALL CreateOpenshift(
        :id,
        :name,
        :console_url,
        ${input.token ? ':token' : 'NULL'},
        ${input.router_pattern ? ':router_pattern' : 'NULL'},
        ${input.project_user ? ':project_user' : 'NULL'},
        ${input.ssh_host ? ':ssh_host' : 'NULL'},
        ${input.ssh_port ? ':ssh_port' : 'NULL'}
      );
    `,
  );

  const rows = await query(sqlClient, prep(input));
  const openshift = R.path([0, 0], rows);

  return openshift;
};

const deleteOpenshift = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const prep = prepare(sqlClient, 'CALL deleteOpenshift(:name)');
  const rows = await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const getAllOpenshifts = sqlClient => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { createdAfter } = args;
  const prep = prepare(sqlClient, 'SELECT * FROM openshift');
  const rows = await query(sqlClient, prep(args));

  return rows.map(attrFilter.openshift(cred));
};

const getOpenshiftByProjectId = sqlClient => async (cred, pid) => {
  const { customers, projects } = cred.permissions;

  const prep = prepare(
    sqlClient,
    `SELECT
        o.*
      FROM project p
      JOIN openshift o ON o.id = p.openshift
      WHERE p.id = :pid
      ${ifNotAdmin(
        cred.role,
        `AND ${inClauseOr([['p.customer', customers], ['p.id', projects]])}`,
      )}
    `,
  );

  const rows = await query(sqlClient, prep({ pid }));

  return rows ? attrFilter.openshift(cred, rows[0]) : null;
};

module.exports = {
  addOpenshift,
  deleteOpenshift,
  getAllOpenshifts,
  getOpenshiftByProjectId,
};
