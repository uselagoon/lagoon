// @flow

const R = require('ramda');
const sqlClient = require('../../clients/sqlClient');
const {
  ifNotAdmin,
  inClauseOr,
  query,
  prepare,
  isPatchEmpty,
} = require('../../util/db');

const Sql = require('./sql');

/* ::

import type {ResolversObj} from '../';

*/

// $FlowFixMe
const attrFilter = R.curry((role, entity) => {
  // Only admin is allowed to see all attributes
  if (role === 'admin') {
    return entity;
  }

  return R.omit(['token'], entity);
});

const addOpenshift = async (args, { input }, { credentials: { role } }) => {
  if (role !== 'admin') {
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

const deleteOpenshift = async (args, { input }, { credentials: { role } }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const prep = prepare(sqlClient, 'CALL deleteOpenshift(:name)');
  await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const getAllOpenshifts = async (
  root,
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const prep = prepare(
    sqlClient,
    `SELECT DISTINCT
        o.*
      FROM project p
      JOIN openshift o ON o.id = p.openshift
      ${ifNotAdmin(
    role,
    `AND ${inClauseOr([['p.customer', customers], ['p.id', projects]])}`,
  )}
    `,
  );

  const rows = await query(sqlClient, prep(args));

  return R.map(attrFilter(role), rows);
};

const getOpenshiftByProjectId = async (
  { id: pid },
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const prep = prepare(
    sqlClient,
    `SELECT
        o.*
      FROM project p
      JOIN openshift o ON o.id = p.openshift
      WHERE p.id = :pid
      ${ifNotAdmin(
    role,
    `AND ${inClauseOr([['p.customer', customers], ['p.id', projects]])}`,
  )}
    `,
  );

  const rows = await query(sqlClient, prep({ pid }));

  return rows ? attrFilter(role, rows[0]) : null;
};

const updateOpenshift = async (root, { input }, { credentials: { role } }) => {
  if (role !== 'admin') {
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

const deleteAllOpenshifts = async (root, args, { credentials: { role } }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateOpenshift());

  // TODO: Check rows for success
  return 'success';
};

const Resolvers /* : ResolversObj */ = {
  addOpenshift,
  deleteOpenshift,
  getAllOpenshifts,
  getOpenshiftByProjectId,
  updateOpenshift,
  deleteAllOpenshifts,
};

module.exports = Resolvers;
