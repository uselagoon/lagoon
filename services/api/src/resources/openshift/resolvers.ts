import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, isPatchEmpty, knex } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';
import { Sql } from './sql';

export const getToken: ResolverFn = async (
  kubernetes,
  _args,
  { hasPermission, userActivityLogger }
) => {
  try {
    await hasPermission('openshift', 'view:token');

    userActivityLogger(`User viewed openshift token`, {
      project: '',
      event: 'api:viewOpenshiftToken',
      payload: {
        name: kubernetes.name,
        id: kubernetes.id
      }
    });

    return kubernetes.token;
  } catch (err) {
    return null;
  }
};

export const getConsoleUrl: ResolverFn = async (
  kubernetes,
  _args,
  { hasPermission }
) => {
  try {
    await hasPermission('openshift', 'view:token');

    return kubernetes.consoleUrl;
  } catch (err) {
    return null;
  }
};

export const getMonitoringConfig: ResolverFn = async (
  kubernetes,
  _args,
  { hasPermission }
) => {
  try {
    await hasPermission('openshift', 'view:token');

    return kubernetes.monitoringConfig;
  } catch (err) {
    return null;
  }
};

export const getProjectUser: ResolverFn = async () => null;

export const addOpenshift: ResolverFn = async (
  args,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('openshift', 'add');

  const { insertId } = await query(sqlClientPool, Sql.insertOpenshift(input));

  const rows = await query(sqlClientPool, Sql.selectOpenshift(insertId));

  userActivityLogger(`User added an openshift '${input.name}'`, {
    project: '',
    event: 'api:addOpenshift',
    payload: {
      name: input.name,
      id: R.prop(0, rows).id
    }
  });

  return R.prop(0, rows);
};

export const deleteOpenshift: ResolverFn = async (
  args,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('openshift', 'delete');

  let res = await query(sqlClientPool, knex('project')
  .join('openshift', 'project.openshift', '=', 'openshift.id')
  .where('openshift.name', input.name).count('project.id', {as: 'numactive'}).toString());

  const numberActiveOs: number = R.path(['0', 'numactive'], res);
  if(numberActiveOs > 0) {
    throw new Error(`Openshift "${input.name} still in use, can not delete`);
  }

  res = await query(sqlClientPool, knex('openshift').where('name', input.name).delete().toString());

  userActivityLogger(`User deleted an openshift '${input.name}'`, {
    project: '',
    event: 'api:deleteOpenshift',
    payload: {
      name: input.name,
    }
  });
  // TODO: maybe check rows for changed result
  return 'success';
};

export const getAllOpenshifts: ResolverFn = async (
  root,
  { disabled, buildImage },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('openshift', 'viewAll');

  let queryBuilder = knex('openshift');
  if (buildImage) {
    queryBuilder = queryBuilder.and.whereNot('build_image', '');
  }

  if (disabled != null) {
    queryBuilder = queryBuilder.where('disabled', disabled);
  }

  return query(sqlClientPool, queryBuilder.toString());
};

export const getOpenshiftByProjectId: ResolverFn = async (
  { id: pid },
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {

  if (!adminScopes.openshiftViewAll) {
    await hasPermission('openshift', 'view', {
      project: pid
    });
  }

  const rows = await query(sqlClientPool, Sql.selectOpenshiftByProjectId(pid));

  return rows ? rows[0] : null;
};

export const getOpenshiftByDeployTargetId: ResolverFn = async (
  { id: did },
  args,
  { sqlClientPool, hasPermission }
) => {
  // get the project id for the deploytarget
  const projectrows = await query(sqlClientPool, Sql.selectProjectIdByDeployTargetId(did)
  );

  // check permissions on the project
  await hasPermission('openshift', 'view', {
    project: projectrows[0].project
  });

  const rows = await query(sqlClientPool, Sql.selectOpenshiftByDeployTargetId(did));

  return rows ? rows[0] : null;
};

export const getOpenshiftByEnvironmentId: ResolverFn = async (
  { id: eid },
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {
  // get the project id for the environment
  const project = await projectHelpers(
    sqlClientPool
  ).getProjectByEnvironmentId(eid);

  // check permissions on the project
  if (!adminScopes.openshiftViewAll) {
    await hasPermission('openshift', 'view', {
      project: project.project
    });
  }

  const rows = await query(sqlClientPool, Sql.selectOpenshiftByEnvironmentId(eid));

  return rows ? rows[0] : null;
};

export const updateOpenshift: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('openshift', 'update');

  const oid = input.id.toString();

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClientPool, Sql.updateOpenshift(input));
  const rows = await query(sqlClientPool, Sql.selectOpenshift(oid));

  userActivityLogger(`User updated an openshift '${R.prop(0, rows).name}'`, {
    project: '',
    event: 'api:updateOpenshift',
    payload: {
      name: R.prop(0, rows).name,
      id: R.prop(0, rows).id
    }
  });

  return R.prop(0, rows);
};
