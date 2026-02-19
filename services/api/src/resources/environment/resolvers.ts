import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { seedNamespace, createMiscTask } from '@lagoon/commons/dist/tasks';
import { getConfigFromEnv } from '../../util/config';
import { ResolverFn } from '../';
import { isPatchEmpty, query, knex } from '../../util/db';
import { convertDateToMYSQLDateFormat } from '../../util/convertDateToMYSQLDateTimeFormat';
import { Helpers } from './helpers';
import { Sql } from './sql';
import { Sql as projectSql } from '../project/sql';
import { Helpers as projectHelpers } from '../project/helpers';
import { Helpers as openshiftHelpers } from '../openshift/helpers';
import { Helpers as organizationHelpers } from '../organization/helpers';
import { getFactFilteredEnvironmentIds } from '../fact/resolvers';
import { getUserProjectIdsFromRoleProjectIds } from '../../util/auth';
import { RemoveData, DeployType, AuditType } from '@lagoon/commons/dist/types';
import { AuditLog } from '../audit/types';
import { logger } from '../../loggers/logger';

// Helper resolver to convert kibUsed to deprecated bytesUsed.
export const getBytesUsed: ResolverFn = async (
  envStorage
) => {
  return envStorage.kibUsed
}

interface EnvironmentService {
    name: string
    type: string
    environment: number
    updated: string
    replicas?: number
}

export const getEnvironmentByName: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {

  if (args.includeDeleted == undefined) {
    args.includeDeleted = true
  }

  const rows = await query(sqlClientPool, Sql.selectEnvironmentByNameAndProjectWithArgs(args.name, args.project, args.includeDeleted));

  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  const environment = withK8s[0];

  if (!environment) {
    return null;
  }

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    await hasPermission('environment', 'view', {
      project: args.project
    });
  }

  return environment;
};

export const getEnvironmentById = async (
  eid,
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {
  // handle dealing with arg or passthrough
  let environmentId = args.id
  if (eid) {
    environmentId = eid.environment
  }
  const environment = await Helpers(sqlClientPool).getEnvironmentById(environmentId);

  if (!environment) {
    return null;
  }
  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    await hasPermission('environment', 'view', {
      project: environment.project
    });
  }

  return environment;
};

export const getEnvironmentsByProjectId: ResolverFn = async (
  project,
  args,
  { sqlClientPool, hasPermission, keycloakGrant, models, adminScopes }
) => {
  const { id: pid } = project;

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    await hasPermission('environment', 'view', {
      project: pid
    });
  }

  let filterEnvironments = false;
  let filteredEnvironments = [];

  if (args.factFilter && args.factFilter.filters && args.factFilter.filters.length !== 0) {
    filterEnvironments = true;
    filteredEnvironments = await getFactFilteredEnvironmentIds(args.factFilter, [project.id], sqlClientPool, false);
  }

  const rows = await query(sqlClientPool, Sql.selectEnvironmentsByProjectId(args.type, pid, args.includeDeleted, filterEnvironments, filteredEnvironments));

  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  return withK8s;
};

export const getEnvironmentByDeploymentId: ResolverFn = async (
  { id: deployment_id },
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {
  const rows = await query(sqlClientPool, Sql.selectEnvironmentByDeploymentId(deployment_id))
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  const environment = withK8s[0];

  if (!environment) {
    return null;
  }

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    await hasPermission('environment', 'view', {
      project: environment.project
    });
  }

  return environment;
};

export const getEnvironmentByTaskId: ResolverFn = async (
  { id: task_id },
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {
  const rows = await query(sqlClientPool, Sql.selectEnvironmentByTaskId(task_id))
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  const environment = withK8s[0];

  if (!environment) {
    return null;
  }

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    await hasPermission('environment', 'view', {
      project: environment.project
    });
  }

  return environment;
};

export const getEnvironmentByBackupId: ResolverFn = async (
  { id: backup_id },
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {
  const rows = await query(sqlClientPool, Sql.selectEnvironmentByBackupId(backup_id))
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  const environment = withK8s[0];

  if (!environment) {
    return null;
  }

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    await hasPermission('environment', 'view', {
      project: environment.project
    });
  }

  return environment;
};

export const getEnvironmentStorageByEnvironmentId: ResolverFn = async (
  { id: eid },
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {
  if (args) {
    // set lastDays to args.lastDays, or 60 if undefined
    let lastDays = args.lastDays || 60;
    if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
      // lastDays to 60 results for non-platform users
      lastDays = Math.min(args.lastDays || 60, 60);

      // check permissions for non-platform users
      const { projectId } = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(
        eid,
      );
      await hasPermission('environment', 'view', {
        project: projectId,
      });
    }

    const rows = await query(sqlClientPool, Sql.selectEnvironmentStorageByEnvironmentIdByDaysClaim({
      eid,
      lastDays,
      claim: args.claim,
      startDate: args.startDate,
      endDate: args.endDate
    }))
    return rows;
  }

  await hasPermission('environment', 'storage');

  const rows = await query(sqlClientPool, Sql.selectEnvironmentStorageByEnvironmentId(eid))

  return rows;
};

export const getEnvironmentStorageMonthByEnvironmentId: ResolverFn = async (
  { id: eid },
  args,
  { models, hasPermission }
) => {
  await hasPermission('environment', 'storage');

  return models.EnvironmentModel.environmentStorageMonthByEnvironmentId(
    eid,
    args.month
  );
};

export const getEnvironmentHoursMonthByEnvironmentId: ResolverFn = async (
  { id: eid },
  args,
  { models, hasPermission }
) => {
  await hasPermission('environment', 'storage');

  return models.EnvironmentModel.environmentHoursMonthByEnvironmentId(
    eid,
    args.month
  );
};

export const getEnvironmentHitsMonthByEnvironmentId: ResolverFn = async (
  { id, openshiftProjectName },
  args,
  { sqlClientPool, models, hasPermission }
) => {
  await hasPermission('environment', 'storage');

  const { name: projectName } = await projectHelpers(
    sqlClientPool
  ).getProjectByEnvironmentId(id);
  return models.EnvironmentModel.environmentHitsMonthByEnvironmentId(
    projectName,
    openshiftProjectName,
    args.month
  );
};

export const getEnvironmentByOpenshiftProjectName: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {

  const rows = await query(sqlClientPool, Sql.selectEnvironmentByOpenshiftProjectName(args.openshiftProjectName));

  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  const environment = withK8s[0];

  if (!environment) {
    return null;
  }

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    await hasPermission('environment', 'view', {
      project: environment.project
    });
  }

  return environment;
};

export const getEnvironmentByKubernetesNamespaceName: ResolverFn = async (
  root,
  args,
  ctx
) =>
  getEnvironmentByOpenshiftProjectName(
    root,
    {
      ...args,
      openshiftProjectName: args.kubernetesNamespaceName
    },
    ctx
  );

export const getEnvironmentsByKubernetes: ResolverFn = async (
  _,
  { kubernetes, order, createdAfter, type },
  { sqlClientPool, hasPermission, models, keycloakGrant, keycloakUsersGroups, adminScopes }
) => {
  const openshift = await openshiftHelpers(
    sqlClientPool
  ).getOpenshiftByOpenshiftInput(kubernetes);

  let userProjectIds: number[];
  // if user is not platform owner or viewer, check the project ids the user has access to
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    const userProjectRoles = await models.UserModel.getAllProjectsIdsForUser(keycloakGrant.access_token.content.sub, keycloakUsersGroups);
    userProjectIds = getUserProjectIdsFromRoleProjectIds(userProjectRoles);
    if (userProjectIds.length == 0) {
      // return an empty result if the user has no project ids
      return [];
    }
  }

  let queryBuilder = knex('environment').where('openshift', openshift.id);

  if (userProjectIds) {
    // A user that can view a project might not be able to view an openshift
    let projectsWithOpenshiftViewPermission: number[] = [];
    for (const pid of userProjectIds) {
      try {
        await hasPermission('openshift', 'view', {
          project: pid
        });
        projectsWithOpenshiftViewPermission = [
          ...projectsWithOpenshiftViewPermission,
          pid
        ];
      } catch { }
    }

    queryBuilder = queryBuilder.whereIn(
      'project',
      projectsWithOpenshiftViewPermission
    );
  }

  if (type) {
    queryBuilder = queryBuilder.andWhere('environment_type', type);
  }

  if (createdAfter) {
    queryBuilder = queryBuilder.andWhere('created', '>=', createdAfter);
  }

  if (order) {
    queryBuilder = queryBuilder.orderBy(order);
  }

  const rows = await query(sqlClientPool, queryBuilder.toString());
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  return withK8s;
};

export const addOrUpdateEnvironment: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {

  const pid = input.project.toString();

  await hasPermission('environment', `addOrUpdate:${input.environmentType}`, {
    project: pid
  });

  // get the project information
  const project = await projectHelpers(sqlClientPool).getProjectById(input.project);

  // pre-configure the namespace with the seed the same way that a build would as a fall back for environments
  // that are created manually via this endpoint
  // it will be changed by a build as necessary, and shouldn't need to be adjusted by a user
  // @TODO: this should be removed at some point. unfortunately the UI still renders everything using the namespace name
  // this means if an environment is seeded with an empty namespace setup, the UI will not be able to access the environment
  // the UI really should be updated to NOT use the namespace name to load the environment, and instead use the name combined with the project
  // both of which are known
  // until that is changed, we have to seed the environment this way :(
  // additional changes to support in the actions handler services/actions-handler/handler/controller_builds.go see @TODO.
  let envNamespaceName = seedNamespace(project.name, input.name);
  // let envNamespaceName = null; // @TODO: this should be used when the UI is adjusted

  /*
    check if an openshift is provided (this should be provided by any functions that call this within lagoon)
    otherwise source the one from the project as a fall back
    (should also check if one already exists from the environment and use that as a first preference)
  */
  let openshift = input.kubernetes || input.openshift;

  try {
    const curEnv = await Helpers(sqlClientPool).getEnvironmentById(input.id);
    openshift = curEnv.openshift
    // set the namespace to whatever the current environment is to ensure it remains unchanged
    envNamespaceName = curEnv.openshiftProjectName
  } catch (err) {
    // do nothing
  }
  if (!openshift) {
    openshift = project.openshift
  }

  // only allow administrators to change the namespace name
  // in most cases, this will just be the build status updates that will provide this information
  // ensuring that the namespace name always reflects what is deployed
  if (input.openshiftProjectName || input.kubernetesNamespaceName) {
    if (adminScopes.platformOwner) {
      envNamespaceName = input.kubernetesNamespaceName || input.openshiftProjectName;
    }
  }

  if (project.organization) {
    // if this would be a new environment, check it against the quota
    const curEnvs = await organizationHelpers(sqlClientPool).getEnvironmentsByOrganizationId(project.organization)
    if (!curEnvs.map(e => e.name).find(i => i === input.name)) {
      // check the environment quota, this prevents environments being added directly via the api
      const curOrg = await organizationHelpers(sqlClientPool).getOrganizationById(project.organization)
      if (curEnvs.length >= curOrg.quotaEnvironment && curOrg.quotaEnvironment != -1) {
        throw new Error(
          `Environment would exceed organization environment quota: ${curEnvs.length}/${curOrg.quotaEnvironment}`
        );
      }
    }
  }

  const inputDefaults = {
    deployHeadRef: null,
    deployTitle: null,
    deleted: 0,
  };

  const insertData = R.pick([
    'deployBaseRef',
    'deployHeadRef',
    'deployTitle',
    'deployType',
    'environmentType',
    'id',
    'name',
    'project',
  ], input);

  const updateData = R.pipe(
    R.pick([
      'deployBaseRef',
      'deployHeadRef',
      'deployTitle',
      'deployType',
      'environmentType',
    ]),
    R.mergeDeepRight({ updated: knex.fn.now() })
  )(input);

  const createOrUpdateSql = knex('environment')
    .insert({
      ...inputDefaults,
      ...insertData,
      openshift,
      openshiftProjectName: envNamespaceName,
    })
    .onConflict('id')
    .merge({
      ...updateData
    }).toString();

  const { insertId } = await query(
    sqlClientPool,
    createOrUpdateSql);

  const rows = await query(sqlClientPool, Sql.selectEnvironmentById(insertId));

  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s([
    R.path([0], rows)
  ]);
  const environment = withK8s[0];

  const auditLog: AuditLog = {
    resource: {
      id: project.id.toString(),
      type: AuditType.PROJECT,
      details: project.name,
    },
    linkedResource: {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
  userActivityLogger(`User updated environment`, {
    project: '',
    event: 'api:addOrUpdateEnvironment',
    payload: {
      ...input,
      ...auditLog,
    }
  });

  return environment;
};

// Deprecated resolver that just calls replacement resolver.
export const addOrUpdateEnvironmentStorage: ResolverFn = async (
  _,
  { input },
  context
) => {
  input.kibUsed = input.bytesUsed

  return addOrUpdateStorageOnEnvironment(undefined, { input: input }, context);
};

export const addOrUpdateStorageOnEnvironment: ResolverFn = async (
  _,
  { input: unformattedInput },
  { sqlClientPool, hasPermission, userActivityLogger },
) => {
  await hasPermission('environment', 'storage');

  const input = {
    ...unformattedInput,
    updated: unformattedInput.updated
      ? unformattedInput.updated
      : convertDateToMYSQLDateFormat(new Date().toISOString()),
  };

  const createOrUpdateSql = knex('environment_storage')
    .insert({
      environment: input.environment,
      kibUsed: input.kibUsed,
      persistentStorageClaim: input.persistentStorageClaim,
      updated: input.updated,
    })
    .onConflict('environment_persistent_storage_claim_updated')
    .merge({
      kibUsed: input.kibUsed,
    })
    .toString();

  await query(sqlClientPool, createOrUpdateSql);

  const rows = (await query(
    sqlClientPool,
    knex('environment_storage')
      .where('persistent_storage_claim', input.persistentStorageClaim)
      .andWhere('environment', input.environment)
      .andWhere('updated', input.updated)
      .toString(),
  )) as {
    id: number;
    persistentStorageClaim: string;
    environment: number;
    kibUsed: number;
    updated: string;
  }[];

  const envStorage = rows[0];
  const {
    name: projectName,
    projectId,
    envName,
  } = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(
    envStorage.environment,
  );

  const auditLog: AuditLog = {
    resource: {
      id: projectId.toString(),
      type: AuditType.PROJECT,
      details: projectName,
    },
    linkedResource: {
      id: envStorage.environment.toString(),
      type: AuditType.ENVIRONMENT,
      details: envName,
    },
  };
  userActivityLogger(
    `User updated environment storage on project '${projectName}'`,
    {
      project: '',
      event: 'api:addOrUpdateEnvironmentStorage',
      payload: {
        projectName,
        input,
        ...auditLog,
      },
    },
  );

  return envStorage;
};

export const deleteEnvironment: ResolverFn = async (
  root,
  { input: { project: projectName, name, execute } },
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

  const environmentRows = await query(
    sqlClientPool,
    Sql.selectEnvironmentByNameAndProject(name, projectId)
  );
  const environment = environmentRows[0];

  if (!environment) {
    throw new Error(
      `Environment "${name}" does not exist in project "${projectId}"`
    );
  }

  await hasPermission('environment', `delete:${environment.environmentType}`, {
    project: projectId
  });

  let canDeleteProduction;
  try {
    await hasPermission('environment', 'delete:production', {
      project: projectId
    });
    canDeleteProduction = true;
  } catch (err) {
    canDeleteProduction = false;
  }

  let removeData: RemoveData = {
    projectName: project.name,
    openshiftProjectName: environment.openshiftProjectName,
    forceDeleteProductionEnvironment: canDeleteProduction,
    environmentName: name
  };

  const meta: {
    [key: string]: any;
  } = {
    projectName: removeData.projectName,
    environmentName: environment.name
  };

  // @TODO: this switch can probably be removed, there shouldn't ever be no deploytype on an environment
  switch (environment.deployType) {
    case DeployType.BRANCH:
    case DeployType.PROMOTE:
    case DeployType.PULLREQUEST:
      break;
    default:
      sendToLagoonLogs(
        'error',
        removeData.projectName,
        '',
        'api:deleteEnvironment:error',
        meta,
        `*[${removeData.projectName}]* Unknown deploy type ${environment.deployType} \`${environment.name}\``
      );
      return `Error: unknown deploy type ${environment.deployType}`;
  }

  // Deleting environment in api w/o executing the openshift remove.
  // This gets called after successful removal from cluster.
  // the environment hasn't been deleted yet
  let deleted = false;

  // check if the execute flag is false
  if (execute === false) {
    try {
      // check the permission to delete with noexec, typically platform level only or system call
      await hasPermission('environment', 'deleteNoExec', {
        project: projectId
      });
      await Helpers(sqlClientPool).deleteEnvironment(name, environment.id, projectId);
      // mark this env as being deleted
      deleted = true;
    } catch (err) {
      // Not allowed to stop execution, proceed with the remaining process of trying to delete the environment the usual way
    }
  }

  // if the deploytarget of this environment is marked as disabled or doesn't exist, just delete the environment
  // the removetask will never work if the deploytarget is disabled and the environment will remain undeleted in the api
  const deploytarget = await Helpers(sqlClientPool).getEnvironmentsDeploytarget(environment.openshift);
  if (deploytarget.length == 0 || deploytarget[0].disabled) {
    // if the deploytarget is disabled, delete the environment
    await Helpers(sqlClientPool).deleteEnvironment(name, environment.id, projectId);
    // mark this env as being deleted
    deleted = true;
  }

  const auditLog: AuditLog = {
    resource: {
      id: environment.project.toString(),
      type: AuditType.PROJECT,
      details: projectName,
    },
    linkedResource: {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
  userActivityLogger(`User deleted environment '${environment.name}' on project '${projectName}'`, {
    project: '',
    event: 'api:deleteEnvironment',
    payload: {
      projectName,
      environment,
      deleted: deleted, // log if the actual deletion took place
      removeData,
      ...auditLog,
    }
  });

  if (deleted) {
    // return sucess to drop out here if the environment was actually deleted from the api, nothing else to do
    return 'success';
  }

  const response = await fetch(
    `http://${getConfigFromEnv('SIDECAR_HANDLER_HOST', 'localhost')}:3333/environment/remove`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // @ts-ignore
      body: new URLSearchParams(removeData).toString(),
    },
  );
  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`Error removing ${environment.name}: ${errorText}`)
    throw new Error(`Error removing ${environment.name}`);
  }

  sendToLagoonLogs(
    'info',
    removeData.projectName,
    '',
    'api:deleteEnvironment',
    meta,
    `*[${removeData.projectName}]* Deleting environment \`${environment.name}\``
  );

  return 'success';
};

export const updateEnvironment: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const id = input.id;
  const curEnv = await Helpers(sqlClientPool).getEnvironmentById(id);

  await hasPermission('environment', `update:${curEnv.environmentType}`, {
    project: curEnv.project
  });

  if (input.patch.openshiftProjectName || input.patch.kubernetesNamespaceName) {
    if (!adminScopes.platformOwner) {
      throw new Error('Setting namespace is only available to administrators.');
    }
  }
  const openshiftProjectName =
    input.patch.kubernetesNamespaceName || input.patch.openshiftProjectName;

  const newType = R.pathOr(
    curEnv.environmentType,
    ['patch', 'environmentType'],
    input
  );
  const newProject = R.pathOr(curEnv.project, ['patch', 'project'], input);

  await hasPermission('environment', `update:${newType}`, {
    project: newProject
  });

  await query(
    sqlClientPool,
    Sql.updateEnvironment({
      id,
      patch: {
        project: input.patch.project,
        deployType: input.patch.deployType,
        deployBaseRef: input.patch.deployBaseRef,
        deployHeadRef: input.patch.deployHeadRef,
        deployTitle: input.patch.deployTitle,
        environmentType: input.patch.environmentType,
        openshift: input.patch.openshift,
        openshiftProjectName,
        route: input.patch.route,
        routes: input.patch.routes,
        autoIdle: input.patch.autoIdle,
        created: input.patch.created,
        idleState: input.patch.idleState
      }
    })
  );

  const rows = await query(sqlClientPool, Sql.selectEnvironmentById(id));
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  const project = await projectHelpers(sqlClientPool).getProjectById(curEnv.project);

  const auditLog: AuditLog = {
    resource: {
      id: curEnv.project.toString(),
      type: AuditType.PROJECT,
      details: project.name
    },
    linkedResource: {
      id: curEnv.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: curEnv.name,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
  userActivityLogger(`User updated environment '${curEnv.name}' on project '${curEnv.project}'`, {
    project: '',
    event: 'api:updateEnvironment',
    payload: {
      openshiftProjectName,
      patch: {
        project: input.patch.project,
        deployType: input.patch.deployType,
        deployBaseRef: input.patch.deployBaseRef,
        deployHeadRef: input.patch.deployHeadRef,
        deployTitle: input.patch.deployTitle,
        environmentType: input.patch.environmentType,
        openshift: input.patch.openshift,
        openshiftProjectName,
        route: input.patch.route,
        routes: input.patch.routes,
        autoIdle: input.patch.autoIdle,
        created: input.patch.created,
        idleState: input.patch.idleState
      },
      data: withK8s,
      ...auditLog,
    }
  });

  return R.prop(0, withK8s);
};

export const getAllEnvironments: ResolverFn = async (
  root,
  { createdAfter, type, order },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('environment', 'viewAll');

  let queryBuilder = knex('environment').where('deleted', '0000-00-00 00:00:00');

  if (createdAfter) {
    queryBuilder = queryBuilder.andWhere('created', '>=', createdAfter);
  }

  if (type) {
    queryBuilder = queryBuilder.andWhere('environment_type', type);
  }

  if (order) {
    queryBuilder = queryBuilder.orderBy(order);
  }

  const rows = await query(sqlClientPool, queryBuilder.toString());
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  return withK8s;
};

// @deprecated in favor of addOrUpdateEnvironmentService and deleteEnvironmentService, will eventually be removed
export const setEnvironmentServices: ResolverFn = async (
  root,
  { input: { environment: environmentId, services } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const environment = await Helpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('environment', `update:${environment.environmentType}`, {
    project: environment.project
  });

  await query(sqlClientPool, Sql.deleteServices(environmentId));

  // remove any duplicates, since there is no other identifying information related to these duplicates don't matter.
  // as this function is also being deprecated its usage over time will eventually drop
  // this means removal of duplicates is an acceptable trade off while the transition takes place
  var uniq = services.filter((value, index, array) => array.indexOf(value) === index);
  for (const service of uniq) {
    await query(sqlClientPool, Sql.insertService(environmentId, service));
  }

  const project = await projectHelpers(sqlClientPool).getProjectById(environment.project)

  const auditLog: AuditLog = {
    resource: {
      id: project.id.toString(),
      type: AuditType.PROJECT,
      details: project.name,
    },
    linkedResource: {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
  };
  userActivityLogger(`User set environment services for '${environment.name}'`, {
    project: '',
    event: 'api:setEnvironmentServices',
    payload: {
      environment,
      services,
      ...auditLog,
    }
  });

  return query(
    sqlClientPool,
    Sql.selectServicesByEnvironmentId(environmentId)
  );
};

export const userCanSshToEnvironment: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  const openshiftProjectName =
    args.kubernetesNamespaceName || args.openshiftProjectName;

  const rows = await query(sqlClientPool, Sql.canSshToEnvironment(openshiftProjectName));
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  const environment = withK8s[0];

  if (!environment) {
    return null;
  }

  try {
    await hasPermission('environment', `ssh:${environment.environmentType}`, {
      project: environment.project
    });

    return environment;
  } catch (err) {
    return null;
  }
};

// this is used to add or update a service in an environment, and the associated containers of that service
// this extends the capabalities of the service now and allows for additional functionality for individual services
export const addOrUpdateEnvironmentService: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const environment = await Helpers(sqlClientPool).getEnvironmentById(
    input.environment
  );
  await hasPermission('environment', `update:${environment.environmentType}`, {
    project: environment.project
  });

  let envService: EnvironmentService = {
    name: input.name,
    type: input.type,
    environment: environment.id,
    updated: knex.fn.now(),
  };

  if (input.replicas || input.replicas === 0) {
    // set the replica count if provided
    envService.replicas = input.replicas
  }

  const createOrUpdateSql = knex('environment_service')
    .insert({
      ...envService,
    })
    .onConflict('id')
    .merge({
      ...envService
    }).toString();

  const { insertId } = await query(
    sqlClientPool,
    createOrUpdateSql);

  if (input.containers){
    // reset this services containers (delete all and add the current ones if provided)
    await Helpers(sqlClientPool).resetServiceContainers(insertId, input.containers)
  }

  const rows = await query(sqlClientPool, Sql.selectEnvironmentServiceById(insertId));

  const project = await projectHelpers(sqlClientPool).getProjectById(environment.project)

  const auditLog: AuditLog = {
    resource: {
      id: project.id.toString(),
      type: AuditType.PROJECT,
      details: project.name,
    },
    linkedResource: {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
  };
  userActivityLogger(`User updated environment '${environment.name}' service '${input.name}`, {
    project: '',
    event: 'api:updateEnvironmentService',
    payload: {
      environment,
      ...auditLog,
    }
  });

  // parese the response through the servicecontainer helper
  return R.prop(0, rows);
};

// delete an environment service from the environment
export const deleteEnvironmentService: ResolverFn = async (
  root,
  { input: { name, environment: eid } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {

  const rows = await query(sqlClientPool, Sql.selectEnvironmentById(eid))
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  const environment = withK8s[0];

  if (!environment) {
    return null;
  }

  const services = await query(sqlClientPool, Sql.selectEnvironmentServiceByName(name, eid));
  const service = services[0];

  if (!service) {
    return null;
  }

  await hasPermission('environment', `delete:${environment.environmentType}`, {
    project: environment.project
  });

  await query(sqlClientPool, Sql.deleteEnvironmentServiceById(service.id));

  const project = await projectHelpers(sqlClientPool).getProjectById(environment.project)

  const auditLog: AuditLog = {
    resource: {
      id: project.id.toString(),
      type: AuditType.PROJECT,
      details: project.name,
    },
    linkedResource: {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
  };
  userActivityLogger(`User deleted environment '${environment.name}' service '${service.name}`, {
    project: '',
    event: 'api:deleteEnvironmentService',
    payload: {
      service,
      ...auditLog,
    }
  });

  return 'success';
};

// this is only ever called by the services resolver, which is called by the environment resolver
// no need to do additional permission checks at this time
export const getEnvironmentByServiceId: ResolverFn = async (
  { id: service_id },
  args,
  { sqlClientPool }
) => {
  const rows = await query(sqlClientPool, Sql.selectEnvironmentByServiceId(service_id))
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  const environment = withK8s[0];

  if (!environment) {
    return null;
  }

  return environment;
};

// this is only ever called by the main environment resolver by the `services` field
// no need to do additional permission checks at this time
export const getEnvironmentServicesByEnvironmentId: ResolverFn = async (
  { id: eid },
  args,
  { sqlClientPool }
) => {
  const rows = await Helpers(sqlClientPool).getEnvironmentServices(eid)
  return rows;
};

// this is only ever called by the services resolver, which is called by the environment resolver
// no need to do additional permission checks at this time
export const getServiceContainersByServiceId: ResolverFn = async (
  { id: sid },
  args,
  { sqlClientPool }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectContainersByServiceId(sid)
  );
  return await rows;
};

export const idleOrUnidleEnvironment = async (
  root,
  {
    input: {
      environment,
      project,
      idle,
      disableAutomaticUnidling
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const projectId = await projectHelpers(sqlClientPool).getProjectIdByName(project)
  const projectData = await projectHelpers(sqlClientPool).getProjectById(projectId)
  const env = await Helpers(sqlClientPool).getEnvironmentByNameAndProject(environment, projectId)
  const environmentData = env[0]
  if (!environmentData) {
    throw new Error(
      `Unauthorized: You don't have permission to "idle" on "environment_state"`
    );
  }
  if (disableAutomaticUnidling) {
    await hasPermission(
      'environment_state',
      `forceScale:${environmentData.environmentType}`,
      {
        project: projectId
      }
    );
  }
  if (idle) {
    switch (idle) {
      case true:
        await hasPermission(
          'environment_state',
          `idle:${environmentData.environmentType}`,
          {
            project: projectId
          }
        );
        break;
      default:
        await hasPermission(
          'environment_state',
          `unidle:${environmentData.environmentType}`,
          {
            project: projectId
          }
        );
        break;
    }
  }

  if (projectData.autoIdle == 0) {
    // if the project has idling disabled, then don't allow idling or unidling of the environment
    throw new Error(
      `Project has idling disabled`
    );
  } else if (projectData.autoIdle == 1 && environmentData.autoIdle == 0) {
    // if the project has idling enabled, but the environment has it disabled
    // then don't allow idling or unidling of the environment
    throw new Error(
      `Environment has idling disabled`
    );
  }

  // don't try idle if the environment is already idled or unidled
  if (environmentData.idleState != 'active' && idle) {
    throw new Error(
      `Environment is already idled`
    );
  }
  if (environmentData.idleState == 'active' && !idle) {
    throw new Error(
      `Environment is already unidled`
    );
  }

  const data = {
    environment: environmentData,
    project: projectData,
    idling: {
      idle: idle,
      forceScale: disableAutomaticUnidling
    }
  };

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
    linkedResource: {
      id: environmentData.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: `${environmentData.name}, idled: ${idle}, unidlingDisabled: ${disableAutomaticUnidling}`,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User requested environment idling for '${environmentData.name}'`, {
    project: '',
    event: 'api:idleOrUnidleEnvironment',
    payload: {
      project: projectData.name,
      environment: environmentData.name,
      ...auditLog,
    }
  });

  try {
    await createMiscTask({ key: 'environment:idling', data });
    return 'success';
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:idleOrUnidleEnvironment',
      { environment: environmentData.id },
      `Environment idle attempt possibly failed, reason: ${error}`
    );
    throw new Error(
      error.message
    );
  }
};

export const stopOrStartEnvironmentService = async (
  root,
  {
    input: {
      environment,
      project,
      serviceName,
      state
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const projectId = await projectHelpers(sqlClientPool).getProjectIdByName(project)
  const projectData = await projectHelpers(sqlClientPool).getProjectById(projectId)
  const env = await Helpers(sqlClientPool).getEnvironmentByNameAndProject(environment, projectId)
  const environmentData = env[0]
  if (!environmentData) {
    throw new Error(
      `Unauthorized: You don't have permission to "restart" on "environment_state"`
    );
  }
  if (environmentData.idleState != 'active') {
    throw new Error(
      `Can't perform action because the environment is idled`
    );
  }
  await hasPermission(
    'environment_state',
    `restart:${environmentData.environmentType}`,
    {
      project: projectId
    }
  );

  const rows = await Helpers(sqlClientPool).getEnvironmentServices(environmentData.id)
  let serviceExists = false;
  if (rows) {
    for (const service of rows) {
      if (service.name != serviceName) {
        continue;
      }
      switch (state) {
        case 'stop':
          if (service.replicas == 0) {
            throw new Error(
              `Service ${serviceName} is already stopped`
            );
          }
          break;
        case 'start':
          if (service.replicas > 0) {
            throw new Error(
              `Service ${serviceName} is already running`
            );
          }
          break;
        default:
          break;
      }
      serviceExists = true
    }
  }
  if (!serviceExists) {
    throw new Error(
      `Service ${serviceName} doesn't exist on environment`
    );
  }

  const data = {
    environment: environmentData,
    project: projectData,
    lagoonService: {
      name: serviceName,
      state: state
    }
  };

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
    linkedResource: {
      id: environmentData.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: `${environmentData.name}, service: ${serviceName}, state: ${state}`,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }

  userActivityLogger(`User requested environment service change for '${environmentData.name}'`, {
    project: '',
    event: 'api:stopOrStartEnvironmentService',
    payload: {
      project: projectData.name,
      environment: environmentData.name,
      ...auditLog
    }
  });

  try {
    await createMiscTask({ key: 'environment:service', data });
    return 'success';
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:stopOrStartEnvironmentService',
      { environment: environmentData.id },
      `Service state change attempt possibly failed, reason: ${error}`
    );
    throw new Error(
      error.message
    );
  }
};
