import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, knex } from '../../util/db';
import { Sql } from './sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Helpers as orgHelpers } from '../organization/helpers';
import { AuditType } from '@lagoon/commons/dist/types';
import { AuditLog, AuditResource } from '../audit/types';
import {logger} from "../../loggers/logger";
import { envVarsConfig } from '../../util/config';

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
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes },
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
  let orgId;

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
      id: org.id.toString(),
      type: AuditType.ORGANIZATION,
      details: org.name,
    }
    orgId = org.id;
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
      // check if project has restriction
      await projectHelpers(sqlClientPool).hasProjectRestriction('no_project_variables', project.id, adminScopes)
      resource = {
        id: project.id.toString(),
        type: AuditType.PROJECT,
        details: project.name,
      }
      if (project.organization) {
        orgId = project.organization
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
        // check if project has restriction
        await projectHelpers(sqlClientPool).hasProjectRestriction('no_environment_variables', project.id, adminScopes)
        resource = {
          id: environment.id.toString(),
          type: AuditType.ENVIRONMENT,
          details: environment.name,
        }
        if (project.organization) {
          orgId = project.organization
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
      id: envVarId.toString(),
      type: AuditType.VARIABLE,
      details: `scope: ${envVarScope}, name: ${envVarName}`,
    },
  };
  if (orgId) {
    auditLog.organizationId = orgId;
  }
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
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes },
) => {
  if (name.trim().length == 0) {
    throw new Error('A variable name must be provided.');
  }

  if (scope === 'internal_container_registry') {
    throw new Error('Variable scope "internal_container_registry" is deprecated & can no longer be set.');
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
  let orgId;

  if (envVarType == EnvVarType.ORGANIZATION) {
    envVarTypeName = orgName;
    const org =
      await orgHelpers(sqlClientPool).getOrganizationByName(orgName);
    await hasPermission('organization', 'addEnvVar', {
      organization: org.id,
    });
    resource = {
      id: org.id.toString(),
      type: AuditType.ORGANIZATION,
      details: org.name,
    }
    orgId = org.id;
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
      // check if project has restriction
      await projectHelpers(sqlClientPool).hasProjectRestriction('no_project_variables', project.id, adminScopes)
      resource = {
        id: project.id.toString(),
        type: AuditType.PROJECT,
        details: project.name,
      }
      if (project.organization) {
        orgId = project.organization
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
      // check if project has restriction
      await projectHelpers(sqlClientPool).hasProjectRestriction('no_environment_variables', project.id, adminScopes)
      resource = {
        id: environment.id.toString(),
        type: AuditType.ENVIRONMENT,
        details: environment.name,
      }
      if (project.organization) {
        orgId = project.organization
      }
      updateData = {
        name: envVarName,
        value,
        scope,
        environment: environment.id,
      };
    }
  }

  // Let's set the updated value for the env var
  updateData['updated'] = knex.fn.now();

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
      id: insertId.toString(),
      type: AuditType.VARIABLE,
      details: `scope: ${scope}, name: ${envVarName}`,
    },
  };
  if (orgId) {
    auditLog.organizationId = orgId;
  }
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
export const addEnvVariable: ResolverFn = async (obj, args, { sqlClientPool, hasPermission, userActivityLogger, adminScopes }) => {
  const {
    input: { type }
  } = args;

  if (args.input.scope === 'internal_container_registry') {
    throw new Error('Variable scope "internal_container_registry" is deprecated & can no longer be set.');
  }

  if (type === 'project') {
    return addEnvVariableToProject(obj, args, { sqlClientPool, hasPermission, userActivityLogger, adminScopes });
  } else if (type === 'environment') {
    return addEnvVariableToEnvironment(obj, args, { sqlClientPool, hasPermission, userActivityLogger, adminScopes });
  }
};

// Deprecated
const addEnvVariableToProject = async (
  root,
  { input: { id, typeId, name, value, scope } },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  await hasPermission('env_var', 'project:add', {
    project: `${typeId}`
  });
  const project =
    await projectHelpers(sqlClientPool).getProjectByProjectInput({id: typeId});
  // check if project has restriction
  await projectHelpers(sqlClientPool).hasProjectRestriction('no_project_variables', typeId, adminScopes)

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
      id: project.id.toString(),
      type: AuditType.PROJECT,
      details: project.name,
    },
    linkedResource: {
      id: insertId.toString(),
      type: AuditType.VARIABLE,
      details: `scope: ${scope}, name: ${name}`,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
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
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
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
  const project = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(environment.id);
  // check if project has restriction
  await projectHelpers(sqlClientPool).hasProjectRestriction('no_environment_variables', environment.project, adminScopes)

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
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
    linkedResource: {
      id: insertId.toString(),
      type: AuditType.VARIABLE,
      details: `scope: ${scope}, name: ${name}`,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
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
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  const perms = await query(sqlClientPool, Sql.selectPermsForEnvVariable(id));

  await hasPermission('env_var', 'delete', {
    project: R.path(['0', 'pid'], perms)
  });

  let resource: AuditResource;
  let orgId;
  const rows = await query(sqlClientPool, Sql.selectEnvVarById(id));
  const envVar = R.prop(0, rows);
  if (envVar.organization) {
    const org =
      await orgHelpers(sqlClientPool).getOrganizationById(envVar.organization);
    resource = {
      id: org.id.toString(),
      type: AuditType.ORGANIZATION,
      details: org.name,
    };
    orgId = org.id;
  } else if (envVar.project) {
    const project =
      await projectHelpers(sqlClientPool).getProjectById(envVar.project);
    // check if project has restriction
    await projectHelpers(sqlClientPool).hasProjectRestriction('no_project_variables', envVar.project, adminScopes)
    resource = {
      id: project.id.toString(),
      type: AuditType.PROJECT,
      details: project.name,
    };
    if (project.organization) {
      orgId = project.organization
    }
  } else if (envVar.environment) {
    const environment =
      await environmentHelpers(sqlClientPool).getEnvironmentById(envVar.environment);
    const project =
      await projectHelpers(sqlClientPool).getProjectById(environment.project);
    // check if project has restriction
    await projectHelpers(sqlClientPool).hasProjectRestriction('no_environment_variables', environment.project, adminScopes)
    resource = {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    };
    if (project.organization) {
      orgId = project.organization
    }
  }

  await query(sqlClientPool, Sql.deleteEnvVariable(id));

  const auditLog: AuditLog = {
    resource: resource,
    linkedResource: {
      id: envVar.id.toString(),
      type: AuditType.VARIABLE,
      details: `scope: ${envVar.scope}, name: ${envVar.name}`,
    },
  };
  if (orgId) {
    auditLog.organizationId = orgId;
  }
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

// ---------------------------------------------------------------------------
// Batch env variable resolvers
//
// These mutations operate on multiple variables for a single target
// (organization, project, or environment). They share the same target
// resolution / permission / project-restriction checks as the singular
// resolvers above, but those checks fail-fast for the whole batch. Per-entry
// errors (validation, DB constraint, etc.) are caught and reported back via
// EnvVariableBatchResult, so a partial failure is observable to the caller.
// ---------------------------------------------------------------------------

type EnvVarBatchTarget = {
  envVarType: EnvVarType;
  envVarTypeName: string;
  resource: AuditResource;
  orgId?: number;
  // Exactly one of these is populated based on envVarType:
  organizationId?: number;
  projectId?: number;
  environmentId?: number;
};

type EnvVarBatchEntryResult = {
  name: string;
  success: boolean;
  envVariable: any | null;
  error: string | null;
};

type EnvVarBatchResult = {
  successCount: number;
  failureCount: number;
  results: EnvVarBatchEntryResult[];
};

// Resolves the (single) target of a batch env-var operation and runs the
// corresponding hasPermission and hasProjectRestriction checks. Throws on
// any whole-batch failure (target not found, permission denied, restriction
// violation, invalid target combo).
const resolveEnvVarBatchTarget = async (
  input: { organization?: string; project?: string; environment?: string },
  action: 'add' | 'delete',
  ctx: { sqlClientPool: any; hasPermission: any; adminScopes: any },
): Promise<EnvVarBatchTarget> => {
  const { sqlClientPool, hasPermission, adminScopes } = ctx;
  const { organization: orgName, project: projectName, environment: environmentName } = input;

  const envVarType = getEnvVarType({
    organization: orgName,
    project: projectName,
    environment: environmentName,
  });

  if (envVarType instanceof Error) {
    throw envVarType;
  }

  if (envVarType === EnvVarType.ORGANIZATION) {
    const org = await orgHelpers(sqlClientPool).getOrganizationByName(orgName);
    if (!org) {
      throw new Error(`Organization '${orgName}' not found`);
    }
    await hasPermission(
      'organization',
      action === 'add' ? 'addEnvVar' : 'deleteEnvVar',
      { organization: org.id },
    );
    return {
      envVarType,
      envVarTypeName: orgName,
      resource: {
        id: org.id.toString(),
        type: AuditType.ORGANIZATION,
        details: org.name,
      },
      orgId: org.id,
      organizationId: org.id,
    };
  }

  // PROJECT or ENVIRONMENT — both need the project resolved first.
  const project = await projectHelpers(sqlClientPool).getProjectByProjectInput({
    name: projectName,
  });
  if (!project) {
    throw new Error(`Project '${projectName}' not found`);
  }

  if (envVarType === EnvVarType.PROJECT) {
    await hasPermission(
      'env_var',
      action === 'add' ? 'project:add' : 'project:delete',
      { project: project.id },
    );
    await projectHelpers(sqlClientPool).hasProjectRestriction(
      'no_project_variables',
      project.id,
      adminScopes,
    );
    return {
      envVarType,
      envVarTypeName: projectName,
      resource: {
        id: project.id.toString(),
        type: AuditType.PROJECT,
        details: project.name,
      },
      orgId: project.organization || undefined,
      projectId: project.id,
    };
  }

  // ENVIRONMENT
  const environmentRows = await query(
    sqlClientPool,
    Sql.selectEnvironmentByNameAndProject(environmentName, project.id),
  );
  const environment = environmentRows[0];
  if (!environment) {
    // For parity with the singular delete resolver: fall back to a project
    // permission check so we don't leak environment existence to callers
    // who can't see the project.
    await hasPermission('project', 'view', { project: project.id });
    throw new Error(`environment ${environmentName} doesn't exist`);
  }
  await hasPermission(
    'env_var',
    action === 'add'
      ? `environment:add:${environment.environmentType}`
      : `environment:delete:${environment.environmentType}`,
    { project: project.id },
  );
  await projectHelpers(sqlClientPool).hasProjectRestriction(
    'no_environment_variables',
    project.id,
    adminScopes,
  );
  return {
    envVarType,
    envVarTypeName: environmentName,
    resource: {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
    orgId: project.organization || undefined,
    projectId: project.id,
    environmentId: environment.id,
  };
};

// Upserts a single env var row for an already-resolved target. Mirrors the
// behavior of addOrUpdateEnvVariableByName but takes a pre-resolved target
// so we can loop without re-resolving for each entry.
const upsertEnvVarRowForTarget = async (
  sqlClientPool: any,
  target: EnvVarBatchTarget,
  entry: { name: string; value: string; scope?: string },
) => {
  if (!entry.name || entry.name.trim().length === 0) {
    throw new Error('A variable name must be provided.');
  }
  if (entry.scope === 'internal_container_registry') {
    throw new Error(
      'Variable scope "internal_container_registry" is deprecated & can no longer be set.',
    );
  }

  const updateData: any = {
    name: entry.name.trim(),
    value: entry.value,
    scope: entry.scope,
    updated: knex.fn.now(),
  };

  if (target.envVarType === EnvVarType.ORGANIZATION) {
    updateData.organization = target.organizationId;
  } else if (target.envVarType === EnvVarType.PROJECT) {
    updateData.project = target.projectId;
  } else if (target.envVarType === EnvVarType.ENVIRONMENT) {
    updateData.environment = target.environmentId;
  }

  const createOrUpdateSql = knex('env_vars')
    .insert({ ...updateData })
    .onConflict('id')
    .merge({ ...updateData })
    .toString();

  const { insertId } = await query(sqlClientPool, createOrUpdateSql);
  const rows = await query(sqlClientPool, Sql.selectEnvVariable(insertId));
  return R.prop(0, rows);
};

// Looks up an env var by name within an already-resolved target and deletes
// it. Idempotent: if the row doesn't exist, returns null without throwing.
const deleteEnvVarRowByNameForTarget = async (
  sqlClientPool: any,
  target: EnvVarBatchTarget,
  name: string,
) => {
  const trimmedName = (name || '').trim();
  if (trimmedName.length === 0) {
    throw new Error('A variable name must be provided.');
  }

  let rows: any[] = [];
  if (target.envVarType === EnvVarType.ORGANIZATION) {
    rows = await query(
      sqlClientPool,
      Sql.selectEnvVarByNameAndOrgId(trimmedName, target.organizationId),
    );
  } else if (target.envVarType === EnvVarType.PROJECT) {
    rows = await query(
      sqlClientPool,
      Sql.selectEnvVarByNameAndProjectId(trimmedName, target.projectId),
    );
  } else if (target.envVarType === EnvVarType.ENVIRONMENT) {
    rows = await query(
      sqlClientPool,
      Sql.selectEnvVarByNameAndEnvironmentId(trimmedName, target.environmentId),
    );
  }

  const row = rows[0];
  if (!row) {
    return null; // idempotent
  }
  await query(sqlClientPool, Sql.deleteEnvVariable(row.id));
  return row;
};

const enforceBatchSize = (size: number, fieldName: string) => {
  if (size === 0) {
    throw new Error(`'${fieldName}' must contain at least one entry.`);
  }
  if (size > envVarsConfig.batchLimit) {
    throw new Error(
      `Batch size ${size} exceeds the maximum of ${envVarsConfig.batchLimit}. ` +
        `Split your request into smaller batches.`,
    );
    // TODO: When request exceeds BATCH_ENV_VARS_LIMIT, server-side chunking
    // could iterate the batch in fixed-size groups and combine results into
    // a single EnvVariableBatchResult. For now we reject oversize batches
    // and require the client to split. See uselagoon/lagoon#4092.
  }
};

export const addOrUpdateEnvVariablesByName: ResolverFn = async (
  root,
  {
    input: {
      project: projectName,
      environment: environmentName,
      organization: orgName,
      variables,
    },
  },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes },
): Promise<EnvVarBatchResult> => {
  enforceBatchSize(variables ? variables.length : 0, 'variables');

  const target = await resolveEnvVarBatchTarget(
    { organization: orgName, project: projectName, environment: environmentName },
    'add',
    { sqlClientPool, hasPermission, adminScopes },
  );

  const results: EnvVarBatchEntryResult[] = [];
  for (const entry of variables) {
    try {
      const row = await upsertEnvVarRowForTarget(sqlClientPool, target, entry);
      results.push({
        name: entry.name,
        success: true,
        envVariable: row,
        error: null,
      });
    } catch (err) {
      logger.warn(
        `Batch upsert env var '${entry.name}' failed for ${target.envVarType} ` +
          `'${target.envVarTypeName}': ${err.message}`,
      );
      results.push({
        name: entry.name,
        success: false,
        envVariable: null,
        error: err.message,
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  const auditLog: AuditLog = {
    resource: target.resource,
    linkedResource: {
      type: AuditType.VARIABLE,
      details:
        `batch addOrUpdate: scope=${target.envVarType} ` +
        `count=${results.length} success=${successCount} failure=${failureCount} ` +
        `names=[${variables.map(v => v.name).join(',')}]`,
    },
  };
  if (target.orgId) {
    auditLog.organizationId = target.orgId;
  }
  userActivityLogger(
    `User batch added/updated environment variables on ${target.envVarType} '${target.envVarTypeName}'`,
    {
      project: projectName,
      event: 'api:addOrUpdateEnvVariablesByName',
      payload: {
        envVarType: target.envVarType,
        envVarTypeName: target.envVarTypeName,
        count: results.length,
        successCount,
        failureCount,
        ...auditLog,
      },
    },
  );

  return { successCount, failureCount, results };
};

export const deleteEnvVariablesByName: ResolverFn = async (
  root,
  {
    input: {
      project: projectName,
      environment: environmentName,
      organization: orgName,
      names,
    },
  },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes },
): Promise<EnvVarBatchResult> => {
  enforceBatchSize(names ? names.length : 0, 'names');

  const target = await resolveEnvVarBatchTarget(
    { organization: orgName, project: projectName, environment: environmentName },
    'delete',
    { sqlClientPool, hasPermission, adminScopes },
  );

  const results: EnvVarBatchEntryResult[] = [];
  for (const name of names) {
    try {
      await deleteEnvVarRowByNameForTarget(sqlClientPool, target, name);
      results.push({
        name,
        success: true,
        envVariable: null,
        error: null,
      });
    } catch (err) {
      logger.warn(
        `Batch delete env var '${name}' failed for ${target.envVarType} ` +
          `'${target.envVarTypeName}': ${err.message}`,
      );
      results.push({
        name,
        success: false,
        envVariable: null,
        error: err.message,
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  const auditLog: AuditLog = {
    resource: target.resource,
    linkedResource: {
      type: AuditType.VARIABLE,
      details:
        `batch delete: scope=${target.envVarType} ` +
        `count=${results.length} success=${successCount} failure=${failureCount} ` +
        `names=[${names.join(',')}]`,
    },
  };
  if (target.orgId) {
    auditLog.organizationId = target.orgId;
  }
  userActivityLogger(
    `User batch deleted environment variables on ${target.envVarType} '${target.envVarTypeName}'`,
    {
      project: projectName,
      event: 'api:deleteEnvVariablesByName',
      payload: {
        envVarType: target.envVarType,
        envVarTypeName: target.envVarTypeName,
        count: results.length,
        successCount,
        failureCount,
        ...auditLog,
      },
    },
  );

  return { successCount, failureCount, results };
};
