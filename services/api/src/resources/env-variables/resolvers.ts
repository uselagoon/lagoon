import * as R from 'ramda';
import { ResolverFn } from '../';
import {
  prepare, query,
} from '../../util/db';
import { Sql } from './sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { userActivityLogger } from '../../loggers/userActivityLogger';

const envVarScopeToString = R.cond([
  [R.equals('GLOBAL'), R.toLower],
  [R.equals('BUILD'), R.toLower],
  [R.equals('RUNTIME'), R.toLower],
  [R.equals('CONTAINER_REGISTRY'), R.toLower],
  [R.equals('INTERNAL_CONTAINER_REGISTRY'), R.toLower],
  [R.T, R.identity],
]);

export const getEnvVarsByProjectId: ResolverFn = async (
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

export const getEnvVarsByEnvironmentId: ResolverFn = async (
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

export const addEnvVariable: ResolverFn = async (obj, args, context) => {
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
    sqlClient, hasPermission, keycloakGrant, legacyCredentials, requestHeaders
  },
) => {
  await hasPermission('env_var', 'project:add', {
    project: `${typeId}`,
  });

  const scope = envVarScopeToString(unformattedScope);
  const project = await projectHelpers(sqlClient).getProjectById(typeId);

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertEnvVariable({
      id,
      name,
      value,
      scope,
      project: project.id,
    }),
  );

  const rows = await query(sqlClient, Sql.selectEnvVariable(insertId));

  userActivityLogger.user_action(`User added environment variable to project '${project.name}'`, {
    user: keycloakGrant || legacyCredentials,
    headers: requestHeaders,
    payload: {
      id,
      name,
      value,
      scope,
      type, typeId,
      project: { id: project.id, name: project.name, gitUrl: project.gitUrl }
    }
  });

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
    sqlClient, hasPermission, keycloakGrant, legacyCredentials, requestHeaders
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

  userActivityLogger.user_action(`User added environment variable to environment '${environment.name}' on '${environment.project}'`, {
    user: keycloakGrant || legacyCredentials,
    headers: requestHeaders,
    payload: {
      id,
      name,
      value,
      scope,
      type, typeId,
      environment
    }
  });

  return R.prop(0, rows);
};

export const deleteEnvVariable: ResolverFn = async (
  root,
  { input: { id } },
  {
    sqlClient, hasPermission, keycloakGrant, legacyCredentials, requestHeaders
  },
) => {
  const perms = await query(sqlClient, Sql.selectPermsForEnvVariable(id));

  await hasPermission('env_var', 'delete', {
    project: R.path(['0', 'pid'], perms),
  });

  await query(sqlClient, Sql.deleteEnvVariable(id));

  userActivityLogger.user_action(`User deleted environment variable`, {
    user: keycloakGrant || legacyCredentials,
    headers: requestHeaders,
    payload: {
      id
    }
  });

  return 'success';
};
