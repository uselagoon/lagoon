// @ts-ignore
import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, knex } from '../../util/db';
import { Sql } from './sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Sql as projectSql } from '../project/sql';
import { logger } from '../../loggers/logger';


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

  userActivityLogger(`User added environment variable to project '${typeId}'`, {
    project: '',
    event: 'api:addEnvVariableToProject',
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

  userActivityLogger(`User added environment variable to environment '${environment.name}' on '${environment.project}'`, {
    project: '',
    event: 'api:addEnvVariableToEnvironment',
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

  userActivityLogger(`User deleted environment variable`, {
    project: '',
    event: 'api:deleteEnvVariable',
    payload: {
      id
    }
  });

  return 'success';
};

// delete an environment variable by name
// if the environment name is provided, it will delete them from the environment, otherwise project
export const deleteEnvVariableByName: ResolverFn = async (
  root,
  { input: { project: projectName, environment: environmentName, name } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const projectId = await projectHelpers(sqlClientPool).getProjectIdByName(
    projectName
  );

  let envVarType = "project"
  let envVarTypeName = projectName
  if (environmentName) {
    // is environment
    const environmentRows = await query(
      sqlClientPool,
      Sql.selectEnvironmentByNameAndProject(environmentName, projectId)
    );
    const environment = environmentRows[0];
    const environmentVariable = await query(
      sqlClientPool,
      Sql.selectEnvVarByNameAndEnvironmentId(name, environment.id)
      );
    const perms = environmentVariable[0];

    await hasPermission('env_var', 'delete', {
      project: R.path(['0', 'pid'], perms)
    });
    envVarType = "environment"
    envVarTypeName = environmentName
    await query(sqlClientPool, Sql.deleteEnvVariable(perms.id));
  } else {
    // is project
    const projectVariable = await query(
      sqlClientPool,
      Sql.selectEnvVarByNameAndProjectId(name, projectId)
      );
    const perms = projectVariable[0];

    await hasPermission('env_var', 'delete', {
      project: R.path(['0', 'pid'], perms)
    });
    await query(sqlClientPool, Sql.deleteEnvVariable(perms.id));
  }

  userActivityLogger(`User deleted environment variable`, {
    project: projectName,
    event: 'api:deleteEnvVariableByName',
    payload: {
      name,
      envVarType,
      envVarTypeName
    }
  });

  return 'success';
};

export const addOrUpdateEnvVariableByName: ResolverFn = async (
  root,
  { input: { project: projectName, environment: environmentName, name, scope, value } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const projectId = await projectHelpers(sqlClientPool).getProjectIdByName(
    projectName
  );

  const projectRows = await query(
    sqlClientPool,
    projectSql.selectProject(projectId)
  );
  const project = projectRows[0];

  let updateData = {};
  let envVarType = "project"
  let envVarTypeName = projectName
  if (environmentName) {
    const environmentRows = await query(
      sqlClientPool,
      Sql.selectEnvironmentByNameAndProject(environmentName, projectId)
    );
    const environment = environmentRows[0];
    await hasPermission(
      'env_var',
      `environment:add:${environment.environmentType}`,
      {
        project: project.id
      }
    );
    updateData = {
      name,
      value,
      scope,
      environment: environment.id,
    }
    envVarType = "environment"
    envVarTypeName = environmentName
  } else {
    // this is a project
    await hasPermission('env_var', 'project:add', {
      project: `${project.id}`
    });
    updateData = {
      name,
      value,
      scope,
      project: project.id,
    }
  }


  const createOrUpdateSql = knex('env_vars')
    .insert({
      ...updateData,
    })
    .onConflict('id')
    .merge({
      ...updateData
    }).toString();

  const { insertId } = await query(
    sqlClientPool,
    createOrUpdateSql);

  const rows = await query(sqlClientPool, Sql.selectEnvVariable(insertId));

  userActivityLogger(`User added environment variable to ${envVarType} '${envVarTypeName}'`, {
    project: projectName,
    event: 'api:addOrUpdateEnvVariableByName',
    payload: {
      name,
      scope,
      envVarType,
      envVarTypeName
    }
  });

  return R.prop(0, rows);
};

export const getEnvVariablesByProjectEnvironmentName: ResolverFn = async (
  root,
  { input: { project: projectName, environment: environmentName } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const projectId = await projectHelpers(sqlClientPool).getProjectIdByName(
    projectName
  );

  if (environmentName) {
    // is environment
    const environmentRows = await query(
      sqlClientPool,
      Sql.selectEnvironmentByNameAndProject(environmentName, projectId)
    );
    const environment = environmentRows[0];

    await hasPermission(
      'env_var',
      `environment:view:${environment.environmentType}`,
      {
        project: environment.project
      }
    );

    const environmentVariables = await query(
      sqlClientPool,
      Sql.selectEnvVarsByEnvironmentId(environment.id)
      );
    return environmentVariables
  } else {

    await hasPermission('env_var', 'project:view', {
      project: projectId
    });
    // is project
    const projectVariables = await query(
      sqlClientPool,
      Sql.selectEnvVarsByProjectId(projectId)
      );
    return projectVariables
  }

  return [];
};