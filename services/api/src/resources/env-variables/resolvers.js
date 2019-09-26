// @flow

const R = require('ramda');
const {
  ifNotAdmin, inClauseOr, prepare, query,
} = require('../../util/db');
const Sql = require('./sql');
const environmentHelpers = require('../environment/helpers');

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
    sqlClient,
    hasPermission,
  },
) => {
  await hasPermission('env_var', 'project:view', {
    project: pid,
  });

  const prep = prepare(
    sqlClient,
    `SELECT
        ev.*
      FROM env_vars ev
      JOIN project p ON ev.project = p.id
      WHERE ev.project = :pid
    `,
  );

  const rows = await query(sqlClient, prep({ pid }));

  return rows;
};

const getEnvVarsByEnvironmentId = async (
  { id: eid },
  args,
  {
    sqlClient,
    hasPermission,
  },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(eid);

  await hasPermission('env_var', `environment:view:${environment.environmentType}`, {
    project: environment.project,
  });

  const prep = prepare(
    sqlClient,
    `SELECT
        ev.*
      FROM env_vars ev
      JOIN environment e on ev.environment = e.id
      JOIN project p ON e.project = p.id
      WHERE ev.environment = :eid
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));

  return rows;
};

const addEnvVariable = async (obj, args, context) => {
  const {
    input: { type },
  } = args;

  if (type.toLowerCase() === 'project') {
    return addEnvVariableToProject(obj, args, context);
  } else if (type.toLowerCase() === 'environment') {
    return addEnvVariableToEnvironment(obj, args, context);
  }
};

const addEnvVariableToProject = async (
  root,
  {
    input: {
      id, type, typeId, name, value, scope: unformattedScope,
    },
  },
  {
    sqlClient,
    hasPermission,
  },
) => {
  await hasPermission('env_var', 'project:add', {
    project: typeId,
  });

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
      id, type, typeId, name, value, scope: unformattedScope,
    },
  },
  {
    sqlClient,
    hasPermission,
  },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(typeId);

  await hasPermission('env_var', `environment:add:${environment.environmentType}`, {
    project: environment.project,
  });

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
    sqlClient,
    hasPermission,
  },
) => {
  const perms = await query(sqlClient, Sql.selectPermsForEnvVariable(id));

  await hasPermission('env_var', 'delete', {
    project: R.path(['0', 'pid'], perms),
  });

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
