// @flow

const R = require('ramda');
const sqlClient = require('../../clients/sqlClient');
const {
  ifNotAdmin,
  inClauseOr,
  prepare,
  query,
} = require('../../util/db');
const Sql = require('./sql');

/* ::

import type {ResolversObj} from '../';

*/

const envVarScopeToString = R.cond([
  [R.equals('GLOBAL'), R.toLower],
  [R.equals('BUILD'), R.toLower],
  [R.equals('RUNTIME'), R.toLower],
  [R.T, R.identity],
]);

const getEnvVarsByProjectId = async (
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
        ev.*
      FROM env_vars ev
      JOIN project p ON ev.project = p.id
      WHERE ev.project = :pid
      ${ifNotAdmin(
    role,
    `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
  )}
    `,
  );

  const rows = await query(sqlClient, prep({ pid }));

  return rows;
};

const getEnvVarsByEnvironmentId = async (
  { id: eid },
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
        ev.*
      FROM env_vars ev
      JOIN environment e on ev.environment = e.id
      JOIN project p ON e.project = p.id
      WHERE ev.environment = :eid
      ${ifNotAdmin(
    role,
    `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
  )}
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));

  return rows;
};

const addEnvVariable = async (obj, args, context) => {
  const { input: { type } } = args;

  if (type.toLowerCase() === 'project') {
    return addEnvVariableToProject(obj, args, context)
  }
  else if (type.toLowerCase() === 'environment') {
    return addEnvVariableToEnvironment(obj, args, context)
  }
};

const addEnvVariableToProject = async (
  root,
  {
    input: {
      id,
      type,
      typeId,
      name,
      value,
      scope: unformattedScope,
    },
  },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  if (role !== 'admin') {
    const rows = await query(
      sqlClient,
      Sql.selectPermsForProject(typeId),
    );

    if (
      !R.contains(R.path(['0', 'pid'], rows), projects) &&
      !R.contains(R.path(['0', 'cid'], rows), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  const scope = envVarScopeToString(unformattedScope);

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertEnvVariable({
      id,
      name,
      value,
      scope,
      project: typeId,
    }),
  );

  const rows = await query(sqlClient, Sql.selectEnvVariable(insertId));

  return R.prop(0, rows);
};

const addEnvVariableToEnvironment = async (
  root,
  {
    input: {
      id,
      type,
      typeId,
      name,
      value,
      scope: unformattedScope,
    },
  },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  if (role !== 'admin') {
    const rows = await query(
      sqlClient,
      Sql.selectPermsForEnvironment(typeId),
    );

    if (
      !R.contains(R.path(['0', 'pid'], rows), projects) &&
      !R.contains(R.path(['0', 'cid'], rows), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  const scope = envVarScopeToString(unformattedScope);

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertEnvVariable({
      id,
      name,
      value,
      scope,
      environment: typeId,
    }),
  );

  const rows = await query(sqlClient, Sql.selectEnvVariable(insertId));

  return R.prop(0, rows);
};

const deleteEnvVariable = async (
  root,
  { input: { id } },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  if (role !== 'admin') {
    const rows = await query(sqlClient, Sql.selectPermsForEnvVariable(id));

    if (
      !R.contains(R.path(['0', 'pid'], rows), projects) &&
      !R.contains(R.path(['0', 'cid'], rows), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  await query(sqlClient, Sql.deleteEnvVariable(id));

  return 'success';
};

const Resolvers /* : ResolversObj */ = {
  getEnvVarsByProjectId,
  getEnvVarsByEnvironmentId,
  addEnvVariable,
  deleteEnvVariable,
};

module.exports = Resolvers;
