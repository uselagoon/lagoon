const R = require('ramda');
const attrFilter = require('./attrFilter');
const {
  knex,
  ifNotAdmin,
  inClauseOr,
  query,
  prepare,
  isPatchEmpty,
} = require('./utils');

const Sql = {
  updateOpenshift: (input) => {
    const { id, patch } = input;

    return knex('openshift')
      .where('id', '=', id)
      .update(patch)
      .toString();
  },
  selectOpenshift: id =>
    knex('openshift')
      .where('id', '=', id)
      .toString(),
};

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

  // const { createdAfter } = args;
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

const updateOpenshift = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const oid = input.id.toString();

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClient, Sql.updateOpenshift(input));
  const rows = await query(sqlClient, Sql.selectOpenshift(oid));

  return R.prop(0, rows);
};

const Queries = {
  addOpenshift,
  deleteOpenshift,
  getAllOpenshifts,
  getOpenshiftByProjectId,
  updateOpenshift,
};

module.exports = {
  Sql,
  Queries,
};
