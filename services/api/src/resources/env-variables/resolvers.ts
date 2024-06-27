import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, knex } from '../../util/db';
import { Sql } from './sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Sql as projectSql } from '../project/sql';


export const getEnvVarsByProjectId: ResolverFn = async (
  { id: pid },
  args,
  { sqlClientPool, hasPermission, adminScopes },
  info
) => {
  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    const index = info.fieldNodes[0].selectionSet.selections.findIndex(item => item.name.value === "value");
    if (index != -1) {
      await hasPermission('env_var', 'project:viewValue', {
        project: pid
      });
      const rows = await query(
        sqlClientPool,
        Sql.selectEnvVarsByProjectId(pid)
      );

      return rows;
    } else {
      await hasPermission('env_var', 'project:view', {
        project: pid
      });
      const rows = await query(
        sqlClientPool,
        Sql.selectEnvVarsWithoutValueByProjectId(pid)
      );

      return rows;
    }
  } else {
    const rows = await query(
      sqlClientPool,
      Sql.selectEnvVarsByProjectId(pid)
    );

    return rows;
  }
}

export const getEnvVarsByEnvironmentId: ResolverFn = async (
  { id: eid },
  args,
  { sqlClientPool, hasPermission, adminScopes },
  info
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(eid)

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    const index = info.fieldNodes[0].selectionSet.selections.findIndex(item => item.name.value === "value");
    if (index != -1) {
      await hasPermission(
        'env_var',
        `environment:viewValue:${environment.environmentType}`,
        {
          project: environment.project
        }
      );

      const rows = await query(
        sqlClientPool,
        Sql.selectEnvVarsByEnvironmentId(eid)
      );

      return rows;
    } else {
      await hasPermission(
        'env_var',
        `environment:view:${environment.environmentType}`,
        {
          project: environment.project
        }
      );
      const rows = await query(
        sqlClientPool,
        Sql.selectEnvVarsWithoutValueByEnvironmentId(eid)
      );

      return rows;
    }
  } else {
    const rows = await query(
      sqlClientPool,
      Sql.selectEnvVarsByEnvironmentId(eid)
    );

    return rows;
  }
}

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

  userActivityLogger(`User added environment variable '${name}' with scope '${scope}' to project '${typeId}'`, {
    project: '',
    event: 'api:addEnvVariableToProject',
    payload: {
      id,
      name,
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

  userActivityLogger(`User added environment variable '${name}' with scope '${scope}' to environment '${environment.name}' on '${environment.project}'`, {
    project: '',
    event: 'api:addEnvVariableToEnvironment',
    payload: {
      id,
      name,
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
    if (environment) {
      const environmentVariable = await query(
        sqlClientPool,
        Sql.selectEnvVarByNameAndEnvironmentId(name, environment.id)
      );
      await hasPermission(
        'env_var',
        `environment:delete:${environment.environmentType}`,
        {
          project: projectId
        }
      );

      if (environmentVariable[0]) {
        envVarType = "environment"
        envVarTypeName = environmentName
        await query(sqlClientPool, Sql.deleteEnvVariable(environmentVariable[0].id));
      } else {
        // variable doesn't exist, just return success
        return "success"
      }
    } else {
      // if the environment doesn't exist, check the user has permission to delete on the project
      // before throwing an error that the environment doesn't exist
      await hasPermission('project', 'view', {
        project: projectId
      });
      throw new Error(
        `environment ${environmentName} doesn't exist`
      );
    }
  } else {
    // is project
    const projectVariable = await query(
      sqlClientPool,
      Sql.selectEnvVarByNameAndProjectId(name, projectId)
    );

    await hasPermission('env_var', 'project:delete', {
      project: projectId
    });
    if (projectVariable[0]) {
      await query(sqlClientPool, Sql.deleteEnvVariable(projectVariable[0].id));
    } else {
      // variable doesn't exist, just return success
      return "success"
    }
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

  if (name.trim().length == 0) {
    throw new Error(
      'A variable name must be provided.'
    );
  }

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
        project: projectId
      }
    );
    updateData = {
      name: name.trim(),
      value,
      scope,
      environment: environment.id,
    }
    envVarType = "environment"
    envVarTypeName = environmentName
  } else {
    // this is a project
    await hasPermission('env_var', 'project:add', {
      project: projectId
    });
    updateData = {
      name: name.trim(),
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
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes },
  info
) => {
  const index = info.fieldNodes[0].selectionSet.selections.findIndex(item => item.name.value === "value");
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

    // if the user is not a platform owner or viewer, then perform normal permission check
    if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
      if (index != -1) {
        await hasPermission(
          'env_var',
          `environment:viewValue:${environment.environmentType}`,
          {
            project: projectId
          }
        );

        const environmentVariables = await query(
          sqlClientPool,
          Sql.selectEnvVarsByEnvironmentId(environment.id)
        );
        return environmentVariables

      } else {
        await hasPermission(
          'env_var',
          `environment:view:${environment.environmentType}`,
          {
            project: projectId
          }
        );

        const environmentVariables = await query(
          sqlClientPool,
          Sql.selectEnvVarsWithoutValueByEnvironmentId(environment.id)
        );
        return environmentVariables
      }
    } else {
      const environmentVariables = await query(
        sqlClientPool,
        Sql.selectEnvVarsByEnvironmentId(environment.id)
      );
      return environmentVariables
    }
  } else if (projectName) {
    // is project
    // if the user is not a platform owner or viewer, then perform normal permission check
    if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
      if (index != -1) {
        await hasPermission('env_var', 'project:viewValue', {
          project: projectId
        });
        const projectVariables = await query(
          sqlClientPool,
          Sql.selectEnvVarsByProjectId(projectId)
        );
        return projectVariables

      } else {
        await hasPermission('env_var', 'project:view', {
          project: projectId
        });
        const projectVariables = await query(
          sqlClientPool,
          Sql.selectEnvVarsWithoutValueByProjectId(projectId)
        );
        return projectVariables
      }
    } else {
      const projectVariables = await query(
        sqlClientPool,
        Sql.selectEnvVarsByProjectId(projectId)
      );
      return projectVariables
    }
  }
  return [];
};
