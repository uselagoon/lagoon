import * as R from 'ramda';
import { ResolverFn } from '../';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';


export const getEnvVarsByProjectId: ResolverFn = async (
  { id: pid },
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('env_var', 'project:view', {
    project: pid
  });

  const rows = await query(
    sqlClientPool,
    `SELECT ev.*
    FROM env_vars ev
    JOIN project p ON ev.project = p.id
    WHERE ev.project = :pid`,
    { pid }
  );

  return rows;
};

export const getEnvVarsByEnvironmentId: ResolverFn = async (
  { id: eid },
  args,
  { sqlClientPool, hasPermission }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(eid);

  await hasPermission(
    'env_var',
    `environment:view:${environment.environmentType}`,
    {
      project: environment.project
    }
  );

  const rows = await query(
    sqlClientPool,
    `SELECT ev.*
    FROM env_vars ev
    JOIN environment e on ev.environment = e.id
    JOIN project p ON e.project = p.id
    WHERE ev.environment = :eid`,
    { eid }
  );

  return rows;
};

export const addEnvVariable: ResolverFn = async (obj, args, context) => {
  const {
    input: { type }
  } = args;

  if (type === 'project') {
    return addEnvVariableToProject(obj, args, context);
  } else if (type === 'environment') {
    return addEnvVariableToEnvironment(obj, args, context);
  }
};

const addEnvVariableToProject = async (
  root,
  { input: { id, typeId, name, value, scope } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('env_var', 'project:add', {
    project: `${typeId}`
  });

  const { insertId } = await query(
    sqlClientPool,
    Sql.insertEnvVariable({
      id,
      name,
      value,
      scope,
      project: typeId
    })
  );

  const rows = await query(sqlClientPool, Sql.selectEnvVariable(insertId));

  userActivityLogger.user_action(`User added environment variable to project '${typeId}'`, {
    payload: {
      id,
      name,
      value,
      scope,
      typeId
    }
  });

  return R.prop(0, rows);
};

const addEnvVariableToEnvironment = async (
  root,
  { input: { id, typeId, name, value, scope } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(typeId);

  await hasPermission(
    'env_var',
    `environment:add:${environment.environmentType}`,
    {
      project: environment.project
    }
  );

  const { insertId } = await query(
    sqlClientPool,
    Sql.insertEnvVariable({
      id,
      name,
      value,
      scope,
      environment: typeId
    })
  );

  const rows = await query(sqlClientPool, Sql.selectEnvVariable(insertId));

  userActivityLogger.user_action(`User added environment variable to environment '${environment.name}' on '${environment.project}'`, {
    payload: {
      id,
      name,
      value,
      scope,
      typeId,
      environment
    }
  });

  return R.prop(0, rows);
};

export const deleteEnvVariable: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const perms = await query(sqlClientPool, Sql.selectPermsForEnvVariable(id));

  await hasPermission('env_var', 'delete', {
    project: R.path(['0', 'pid'], perms)
  });

  await query(sqlClientPool, Sql.deleteEnvVariable(id));

  userActivityLogger.user_action(`User deleted environment variable`, {
    payload: {
      id
    }
  });

  return 'success';
};
