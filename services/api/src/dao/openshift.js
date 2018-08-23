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

const addOpenshift = ({ sqlClient }) => async (cred, input) => {
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
        ${input.routerPattern ? ':router_pattern' : 'NULL'},
        ${input.projectUser ? ':project_user' : 'NULL'},
        ${input.sshHost ? ':ssh_host' : 'NULL'},
        ${input.sshPort ? ':ssh_port' : 'NULL'}
      );
    `,
  );

  const rows = await query(sqlClient, prep(input));
  const openshift = R.path([0, 0], rows);

  return openshift;
};

const deleteOpenshift = ({ sqlClient }) => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const prep = prepare(sqlClient, 'CALL deleteOpenshift(:name)');
  await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const getAllOpenshifts = ({ sqlClient }) => async (cred, args) => {
  const { customers, projects } = cred.permissions;

  const prep = prepare(
    sqlClient,
    `SELECT DISTINCT
        o.*
      FROM project p
      JOIN openshift o ON o.id = p.openshift
      ${ifNotAdmin(
    cred.role,
    `AND ${inClauseOr([['p.customer', customers], ['p.id', projects]])}`,
  )}
    `,
  );

  const rows = await query(sqlClient, prep(args));

  return R.map(attrFilter.openshift(cred), rows);
};

const getOpenshiftByProjectId = ({ sqlClient }) => async (cred, pid) => {
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

const updateOpenshift = ({ sqlClient }) => async (cred, input) => {
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
