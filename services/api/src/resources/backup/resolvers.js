// @flow

const R = require('ramda');
const { query, isPatchEmpty } = require('../../util/db');
const sqlClient = require('../../clients/sqlClient');
const Sql = require('./sql');

/* ::

import type {ResolversObj} from '../';

*/

const getBackupsByEnvironmentId = async (
  { id: environmentId },
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const rows = await query(
    sqlClient,
    Sql.selectBackupsByEnvironmentId({ environmentId }),
  );
  return rows;
};

const addBackup = async (
  root,
  {
    input: {
      id, environment, source, backupId, created,
    },
  },
) => {
  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertBackup({
      id,
      environment,
      source,
      backupId,
      created,
    }),
  );
  const rows = await query(sqlClient, Sql.selectBackup(insertId));
  return R.prop(0, rows);
};

const deleteAllBackups = async (root, args, { credentials: { role } }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateBackup());

  // TODO: Check rows for success
  return 'success';
};

const Resolvers /* : ResolversObj */ = {
  addBackup,
  getBackupsByEnvironmentId,
  deleteAllBackups,
};

module.exports = Resolvers;
