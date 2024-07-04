import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createRemoveTask } from '@lagoon/commons/dist/tasks';
import { ResolverFn } from '../';
import { logger } from '../../loggers/logger';
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
  root,
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {
  const environment = await Helpers(sqlClientPool).getEnvironmentById(args.id);

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
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('environment', 'storage');

  const rows = await query(sqlClientPool, Sql.selectEnvironmentStorageByEnvironmentId(eid))

  // @DEPRECATE when `bytesUsed` is completely removed, this can be reverted
  return rows.map(row => ({ ...row, bytesUsed: row.kibUsed}));
  // return rows;
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
  { sqlClientPool, hasPermission, models, keycloakGrant, keycloakUsersGroups }
) => {
  const openshift = await openshiftHelpers(
    sqlClientPool
  ).getOpenshiftByOpenshiftInput(kubernetes);

  let userProjectIds: number[];
  try {
    await hasPermission('openshift', 'viewAll');
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getEnvironmentsByKubernetes');
      return [];
    }

    // Only return projects the user can view
    const userProjectRoles = await models.UserModel.getAllProjectsIdsForUser(keycloakGrant.access_token.content.sub, keycloakUsersGroups);
    userProjectIds = getUserProjectIdsFromRoleProjectIds(userProjectRoles);
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
  { sqlClientPool, hasPermission, userActivityLogger }
) => {

  const pid = input.project.toString();
  const openshiftProjectName =
    input.kubernetesNamespaceName || input.openshiftProjectName;
  if (!openshiftProjectName) {
    throw new Error(
      'Must provide kubernetesNamespaceName or openshiftProjectName'
    );
  }

  await hasPermission('environment', `addOrUpdate:${input.environmentType}`, {
    project: pid
  });

  /*
    check if an openshift is provided (this should be provided by any functions that call this within lagoon)
    otherwise source the one from the project as a fall back
    (should also check if one already exists from the environment and use that as a first preference)
  */
  let openshift = input.kubernetes || input.openshift;
  let openshiftProjectPattern = input.kubernetesNamespacePattern || input.openshiftProjectPattern;

  try {
    const curEnv = await Helpers(sqlClientPool).getEnvironmentById(input.id);
    openshift = curEnv.openshift
    openshiftProjectPattern = curEnv.openshiftProjectPattern
  } catch (err) {
    // do nothing
  }
  const projectOpenshift = await projectHelpers(sqlClientPool).getProjectById(input.project);
  if (!openshift) {
    openshift = projectOpenshift.openshift
  }
  if (!openshiftProjectPattern) {
    openshiftProjectPattern = projectOpenshift.openshiftProjectPattern
  }

  if (projectOpenshift.organization) {
    // if this would be a new environment, check it against the quota
    const curEnvs = await organizationHelpers(sqlClientPool).getEnvironmentsByOrganizationId(projectOpenshift.organization)
    if (!curEnvs.map(e => e.name).find(i => i === input.name)) {
      // check the environment quota, this prevents environments being added directly via the api
      const curOrg = await organizationHelpers(sqlClientPool).getOrganizationById(projectOpenshift.organization)
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
      openshiftProjectName,
      openshiftProjectPattern
    })
    .onConflict('id')
    .merge({
      ...updateData
    }).toString();

  const { insertId } = await query(
    sqlClientPool,
    createOrUpdateSql);

  const rows = await query(sqlClientPool, Sql.selectEnvironmentById(insertId));

  userActivityLogger(`User updated environment`, {
    project: '',
    event: 'api:addOrUpdateEnvironment',
    payload: {
      ...input
    }
  });

  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s([
    R.path([0], rows)
  ]);
  const environment = withK8s[0];

  return environment;
};

export const addOrUpdateEnvironmentStorage: ResolverFn = async (
  root,
  { input: unformattedInput },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('environment', 'storage');

  const input = {
    ...unformattedInput,
    updated: unformattedInput.updated
      ? unformattedInput.updated
      : convertDateToMYSQLDateFormat(new Date().toISOString())
  };


  // @DEPRECATE when `bytesUsed` is completely removed, this block can be removed
  if (input.kibUsed) {
    // remove the bytesUsed input if kilobytes is provided
    delete input.bytesUsed
  } else {
    // else set kibUsed to the old required input, then remove the old input
    input.kibUsed = input.bytesUsed
    delete input.bytesUsed
  }

  const createOrUpdateSql = knex('environment_storage')
    .insert(input)
    .onConflict('id')
    .merge({
      kibUsed: input.kibUsed
    }).toString();

  const { insertId } = await query(
    sqlClientPool,
    createOrUpdateSql
  );

  const rows = await query(sqlClientPool,
    knex("environment_storage")
      .where("persistent_storage_claim", input.persistentStorageClaim)
      .andWhere("environment", input.environment)
      .andWhere("updated", input.updated)
      .toString()
  );

  // @DEPRECATE when `bytesUsed` is completely removed, this can be reverted
  const environment = R.path([0], rows.map(row => ({ ...row, bytesUsed: row.kibUsed})));
  // const environment = R.path([0], rows);
  const { name: projectName } = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(environment['environment']);

  userActivityLogger(`User updated environment storage on project '${projectName}'`, {
    project: '',
    event: 'api:addOrUpdateEnvironmentStorage',
    payload: {
      projectName,
      input
    }
  });

  return environment;
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

  // Deleting environment in api w/o executing the openshift remove.
  // This gets called after successful removal from cluster.
  if (execute === false) {
    try {
      await hasPermission('environment', 'deleteNoExec', {
        project: projectId
      });
      await Helpers(sqlClientPool).deleteEnvironment(name, environment.id, projectId);

      return 'success';
    } catch (err) {
      // Not allowed to stop execution.
    }
  }

  let canDeleteProduction;
  try {
    await hasPermission('environment', 'delete:production', {
      project: projectId
    });
    canDeleteProduction = true;
  } catch (err) {
    canDeleteProduction = false;
  }

  let data: {
    [key: string]: any;
  } = {
    projectName: project.name,
    type: environment.deployType,
    openshiftProjectName: environment.openshiftProjectName,
    forceDeleteProductionEnvironment: canDeleteProduction
  };

  const meta: {
    [key: string]: any;
  } = {
    projectName: data.projectName,
    environmentName: environment.name
  };

  switch (environment.deployType) {
    case 'branch':
    case 'promote':
      data = {
        ...data,
        branch: name
      };
      break;

    case 'pullrequest':
      data = {
        ...data,
        pullrequestNumber: environment.name.replace('pr-', '')
      };
      break;

    default:
      sendToLagoonLogs(
        'error',
        data.projectName,
        '',
        'api:deleteEnvironment:error',
        meta,
        `*[${data.projectName}]* Unknown deploy type ${environment.deployType} \`${environment.name}\``
      );
      return `Error: unknown deploy type ${environment.deployType}`;
  }

  userActivityLogger(`User deleted environment '${environment.name}' on project '${projectName}'`, {
    project: '',
    event: 'api:deleteEnvironment',
    payload: {
      projectName,
      environment,
      data
    }
  });

  // if the deploytarget of this environment is marked as disabled or doesn't exist, just delete the environment
  // the removetask will never work if the deploytarget is disabled and the environment will remain undeleted in the api
  const deploytarget = await Helpers(sqlClientPool).getEnvironmentsDeploytarget(environment.openshift);
  if (deploytarget.length == 0 || deploytarget[0].disabled) {
    await Helpers(sqlClientPool).deleteEnvironment(name, environment.id, projectId);
    return 'success';
  }

  await createRemoveTask(data);
  sendToLagoonLogs(
    'info',
    data.projectName,
    '',
    'api:deleteEnvironment',
    meta,
    `*[${data.projectName}]* Deleting environment \`${environment.name}\``
  );

  return 'success';
};

export const updateEnvironment: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const id = input.id;
  const curEnv = await Helpers(sqlClientPool).getEnvironmentById(id);
  const openshiftProjectName =
    input.patch.kubernetesNamespaceName || input.patch.openshiftProjectName;

  await hasPermission('environment', `update:${curEnv.environmentType}`, {
    project: curEnv.project
  });

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
        created: input.patch.created
      }
    })
  );

  const rows = await query(sqlClientPool, Sql.selectEnvironmentById(id));
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

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
        created: input.patch.created
      },
      data: withK8s
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

  userActivityLogger(`User set environment services for '${environment.name}'`, {
    project: '',
    event: 'api:setEnvironmentServices',
    payload: {
      environment,
      services
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

  let updateData = {
    name: input.name,
    type: input.type,
    environment: environment.id,
    updated: knex.fn.now(),
  };

  const createOrUpdateSql = knex('environment_service')
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

  // reset this services containers (delete all and add the current ones)
  await Helpers(sqlClientPool).resetServiceContainers(insertId, input.containers)

  const rows = await query(sqlClientPool, Sql.selectEnvironmentServiceById(insertId));

  userActivityLogger(`User updated environment '${environment.name}' service '${input.name}`, {
    project: '',
    event: 'api:updateEnvironmentService',
    payload: {
      environment
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

  userActivityLogger(`User deleted environment '${environment.name}' service '${service.name}`, {
    project: '',
    event: 'api:deleteEnvironmentService',
    payload: {
      service,
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
  const rows = await query(
    sqlClientPool,
    Sql.selectServicesByEnvironmentId(eid)
  );
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
