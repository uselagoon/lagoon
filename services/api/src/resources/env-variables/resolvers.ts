import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, knex } from '../../util/db';
import { Sql } from './sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Helpers as orgHelpers } from '../organization/helpers';
import { AuditType } from '@lagoon/commons/dist/types';
import { AuditLog, AuditResource } from '../audit/types';

export enum EnvVarType {
  ORGANIZATION = 'organization',
  PROJECT = 'project',
  ENVIRONMENT = 'environment',
}

const getEnvVarType = (envVars: {
  organization?: String;
  project?: String;
  environment?: String;
}): EnvVarType | Error => {
  if (envVars.organization && !envVars.project && !envVars.environment) {
    return EnvVarType.ORGANIZATION;
  } else if (!envVars.organization && envVars.project && !envVars.environment) {
    return EnvVarType.PROJECT;
  } else if (!envVars.organization && envVars.project && envVars.environment) {
    return EnvVarType.ENVIRONMENT;
  }

  return new Error(
    'Error determining type. Submit an organization name, a project name, or a project name and environment name.',
  );
};

export const getEnvVarsByOrganizationId: ResolverFn = async (
  { id: oid },
  _,
  { sqlClientPool, hasPermission },
) => {
  await hasPermission('organization', 'viewEnvVar', {
    organization: oid,
  });
  const rows = await query(sqlClientPool, Sql.selectEnvVarsByOrgId(oid));

  return rows;
};

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

export const deleteEnvVariableByName: ResolverFn = async (
  root,
  {
    input: {
      project: projectName,
      environment: environmentName,
      organization: orgName,
      name,
    },
  },
  { sqlClientPool, hasPermission, userActivityLogger },
) => {
  const envVarType = getEnvVarType({
    organization: orgName,
    project: projectName,
    environment: environmentName,
  });

  if (envVarType instanceof Error) {
    throw envVarType;
  }

  let resource: AuditResource;
  let envVarId;
  let envVarName;
  let envVarScope;
  let envVarTypeName = '';

  if (envVarType == EnvVarType.ORGANIZATION) {
    envVarTypeName = orgName;
    const org =
      await orgHelpers(sqlClientPool).getOrganizationByName(orgName);
    const orgVariable = await query(
      sqlClientPool,
      Sql.selectEnvVarByNameAndOrgId(name, org.id),
    );

    await hasPermission('organization', 'deleteEnvVar', {
      organization: org.id,
    });
    resource = {
      id: org.id,
      type: AuditType.ORGANIZATION,
      details: org.name,
    }
    if (orgVariable[0]) {
      envVarScope = orgVariable[0].scope
      envVarId = orgVariable[0].id
      envVarName = orgVariable[0].name
      await query(sqlClientPool, Sql.deleteEnvVariable(orgVariable[0].id));
    } else {
      // variable doesn't exist, just return success
      return 'success';
    }
  } else {
    const project =
      await projectHelpers(sqlClientPool).getProjectByProjectInput({name: projectName});

    if (envVarType == EnvVarType.PROJECT) {
      envVarTypeName = projectName;
      const projectVariable = await query(
        sqlClientPool,
        Sql.selectEnvVarByNameAndProjectId(name, project.id),
      );

      await hasPermission('env_var', 'project:delete', {
        project: project.id,
      });
      resource = {
        id: project.id,
        type: AuditType.PROJECT,
        details: project.name,
      }
      if (projectVariable[0]) {
        envVarScope = projectVariable[0].scope
        envVarId = projectVariable[0].id
        envVarName = projectVariable[0].name
        await query(
          sqlClientPool,
          Sql.deleteEnvVariable(projectVariable[0].id),
        );
      } else {
        // variable doesn't exist, just return success
        return 'success';
      }
    } else if (envVarType == EnvVarType.ENVIRONMENT) {
      const environmentRows = await query(
        sqlClientPool,
        Sql.selectEnvironmentByNameAndProject(environmentName, project.id),
      );
      const environment = environmentRows[0];
      if (environment) {
        const environmentVariable = await query(
          sqlClientPool,
          Sql.selectEnvVarByNameAndEnvironmentId(name, environment.id),
        );
        await hasPermission(
          'env_var',
          `environment:delete:${environment.environmentType}`,
          {
            project: project.id,
          },
        );

        resource = {
          id: environment.id,
          type: AuditType.ENVIRONMENT,
          details: environment.name,
        }
        if (environmentVariable[0]) {
          envVarScope = environmentVariable[0].scope
          envVarId = environmentVariable[0].id
          envVarName = environmentVariable[0].name
          envVarTypeName = environmentName;
          await query(
            sqlClientPool,
            Sql.deleteEnvVariable(environmentVariable[0].id),
          );
        } else {
          // variable doesn't exist, just return success
          return 'success';
        }
      } else {
        // if the environment doesn't exist, check the user has permission to delete on the project
        // before throwing an error that the environment doesn't exist
        await hasPermission('project', 'view', {
          project: project.id,
        });
        throw new Error(`environment ${environmentName} doesn't exist`);
      }
    }
  }

  const auditLog: AuditLog = {
    resource: resource,
    linkedResource: {
      id: envVarId,
      type: AuditType.VARIABLE,
      details: `scope: ${envVarScope}, name: ${envVarName}`,
    },
  };
  userActivityLogger(`User deleted environment variable`, {
    project: projectName,
    event: 'api:deleteEnvVariableByName',
    payload: {
      name,
      envVarType,
      envVarTypeName,
      ...auditLog,
    },
  });

  return 'success';
};

export const addOrUpdateEnvVariableByName: ResolverFn = async (
  root,
  {
    input: {
      project: projectName,
      environment: environmentName,
      organization: orgName,
      name,
      scope,
      value,
    },
  },
  { sqlClientPool, hasPermission, userActivityLogger },
) => {
  if (name.trim().length == 0) {
    throw new Error('A variable name must be provided.');
  }

  const envVarType = getEnvVarType({
    organization: orgName,
    project: projectName,
    environment: environmentName,
  });

  if (envVarType instanceof Error) {
    throw envVarType;
  }

  let resource: AuditResource;

  let updateData = {};
  let envVarTypeName = '';
  let envVarName = name.trim();

  if (envVarType == EnvVarType.ORGANIZATION) {
    envVarTypeName = orgName;
    const org =
      await orgHelpers(sqlClientPool).getOrganizationByName(orgName);
    await hasPermission('organization', 'addEnvVar', {
      organization: org.id,
    });
    resource = {
      id: org.id,
      type: AuditType.ORGANIZATION,
      details: org.name,
    }
    updateData = {
      name: envVarName,
      value,
      scope,
      organization: org.id,
    };
  } else {
    const project =
      await projectHelpers(sqlClientPool).getProjectByProjectInput({name: projectName});

    if (envVarType === EnvVarType.PROJECT) {
      envVarTypeName = projectName;
      await hasPermission('env_var', 'project:add', {
        project: project.id,
      });
      resource = {
        id: project.id,
        type: AuditType.PROJECT,
        details: project.name,
      }
      updateData = {
        name: envVarName,
        value,
        scope,
        project: project.id,
      };
    } else if (envVarType == EnvVarType.ENVIRONMENT) {
      envVarTypeName = environmentName;
      const environmentRows = await query(
        sqlClientPool,
        Sql.selectEnvironmentByNameAndProject(environmentName, project.id),
      );
      const environment = environmentRows[0];
      await hasPermission(
        'env_var',
        `environment:add:${environment.environmentType}`,
        {
          project: project.id,
        },
      );
      resource = {
        id: environment.id,
        type: AuditType.ENVIRONMENT,
        details: environment.name,
      }
      updateData = {
        name: envVarName,
        value,
        scope,
        environment: environment.id,
      };
    }
  }

  const createOrUpdateSql = knex('env_vars')
    .insert({
      ...updateData,
    })
    .onConflict('id')
    .merge({
      ...updateData,
    })
    .toString();

  const { insertId } = await query(sqlClientPool, createOrUpdateSql);

  const rows = await query(sqlClientPool, Sql.selectEnvVariable(insertId));

  const auditLog: AuditLog = {
    resource: resource,
    linkedResource: {
      id: insertId,
      type: AuditType.VARIABLE,
      details: `scope: ${scope}, name: ${envVarName}`,
    },
  };
  userActivityLogger(
    `User added environment variable to ${envVarType} '${envVarTypeName}'`,
    {
      project: projectName,
      event: 'api:addOrUpdateEnvVariableByName',
      payload: {
        name,
        scope,
        envVarType,
        envVarTypeName,
        ...auditLog,
      },
    },
  );

  return R.prop(0, rows);
};

export const getEnvVariablesByProjectEnvironmentName: ResolverFn = async (
  root,
  { input: { project: projectName, environment: environmentName } },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes },
  info
) => {
  const index = info.fieldNodes[0].selectionSet.selections.findIndex(item => item.name.value === "value");
  const project = await projectHelpers(sqlClientPool).getProjectByProjectInput(
    {name: projectName}
  );

  if (environmentName) {
    // is environment
    const environmentRows = await query(
      sqlClientPool,
      Sql.selectEnvironmentByNameAndProject(environmentName, project.id)
    );
    const environment = environmentRows[0];

    // if the user is not a platform owner or viewer, then perform normal permission check
    if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
      if (index != -1) {
        await hasPermission(
          'env_var',
          `environment:viewValue:${environment.environmentType}`,
          {
            project: project.id
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
            project: project.id
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
          project: project.id
        });
        const projectVariables = await query(
          sqlClientPool,
          Sql.selectEnvVarsByProjectId(project.id)
        );
        return projectVariables

      } else {
        await hasPermission('env_var', 'project:view', {
          project: project.id
        });
        const projectVariables = await query(
          sqlClientPool,
          Sql.selectEnvVarsWithoutValueByProjectId(project.id)
        );
        return projectVariables
      }
    } else {
      const projectVariables = await query(
        sqlClientPool,
        Sql.selectEnvVarsByProjectId(project.id)
      );
      return projectVariables
    }
  }
  return [];
};

// Deprecated
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

// Deprecated
const addEnvVariableToProject = async (
  root,
  { input: { id, typeId, name, value, scope } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('env_var', 'project:add', {
    project: `${typeId}`
  });
  const project =
    await projectHelpers(sqlClientPool).getProjectByProjectInput({id: typeId});

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

  const auditLog: AuditLog = {
    resource: {
      id: project.id,
      type: AuditType.PROJECT,
      details: project.name,
    },
    linkedResource: {
      id: insertId,
      type: AuditType.VARIABLE,
      details: `scope: ${scope}, name: ${name}`,
    },
  };
  userActivityLogger(`User added environment variable '${name}' with scope '${scope}' to project '${typeId}'`, {
    project: '',
    event: 'api:addEnvVariableToProject',
    payload: {
      id,
      name,
      scope,
      typeId,
      ...auditLog,
    }
  });

  return R.prop(0, rows);
};

// Deprecated
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

  const auditLog: AuditLog = {
    resource: {
      id: environment.id,
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
    linkedResource: {
      id: insertId,
      type: AuditType.VARIABLE,
      details: `scope: ${scope}, name: ${name}`,
    },
  };
  userActivityLogger(`User added environment variable '${name}' with scope '${scope}' to environment '${environment.name}' on '${environment.project}'`, {
    project: '',
    event: 'api:addEnvVariableToEnvironment',
    payload: {
      id,
      name,
      scope,
      typeId,
      environment,
      ...auditLog,
    }
  });

  return R.prop(0, rows);
};

// Deprecated
export const deleteEnvVariable: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const perms = await query(sqlClientPool, Sql.selectPermsForEnvVariable(id));

  await hasPermission('env_var', 'delete', {
    project: R.path(['0', 'pid'], perms)
  });

  let resource: AuditResource;
  const rows = await query(sqlClientPool, Sql.selectEnvVarById(id));
  const envVar = R.prop(0, rows);
  if (envVar.organization) {
    const org =
      await orgHelpers(sqlClientPool).getOrganizationById(envVar.organization);
    resource = {
      id: org.id,
      type: AuditType.ORGANIZATION,
      details: org.name,
    };
  } else if (envVar.project) {
    const project =
      await projectHelpers(sqlClientPool).getProjectById(envVar.project);
    resource = {
      id: project.id,
      type: AuditType.PROJECT,
      details: project.name,
    };
  } else if (envVar.environment) {
    const environment =
      await environmentHelpers(sqlClientPool).getEnvironmentById(envVar.environment);
    resource = {
      id: environment.id,
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    };
  }

  await query(sqlClientPool, Sql.deleteEnvVariable(id));

  const auditLog: AuditLog = {
    resource: resource,
    linkedResource: {
      id: envVar.id,
      type: AuditType.VARIABLE,
      details: `scope: ${envVar.scope}, name: ${envVar.name}`,
    },
  };
  userActivityLogger(`User deleted environment variable`, {
    project: '',
    event: 'api:deleteEnvVariable',
    payload: {
      id,
      ...auditLog,
    }
  });

  return 'success';
};
