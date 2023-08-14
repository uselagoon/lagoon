import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, isPatchEmpty, knex } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';
import { Sql } from './sql';

export const getToken: ResolverFn = async (
  kubernetes,
  _args,
  { hasPermission }
) => {
  try {
    await hasPermission('openshift', 'view:token');

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
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('openshift', 'add');

  const { insertId } = await query(sqlClientPool, Sql.insertOpenshift(input));

  const rows = await query(sqlClientPool, Sql.selectOpenshift(insertId));
  return R.prop(0, rows);
};

export const deleteOpenshift: ResolverFn = async (
  args,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('openshift', 'delete');

  let res = await query(sqlClientPool, knex('project')
  .join('openshift', 'project.openshift', '=', 'openshift.id')
  .where('openshift.name', input.name).count('project.id', {as: 'numactive'}).toString());

  const numberActiveOs = R.path(['0', 'numactive'], res);
  if(numberActiveOs > 0) {
    throw new Error(`Openshift "${input.name} still in use, can not delete`);
  }

  res = await query(sqlClientPool, knex('openshift').where('name', input.name).delete().toString());

  // TODO: maybe check rows for changed result
  return 'success';
};

export const getAllOpenshifts: ResolverFn = async (
  root,
  { disabled },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('openshift', 'viewAll');

  if (disabled != null) {
    return query(sqlClientPool, knex('openshift').where('disabled', disabled).toString());
  }
  return query(sqlClientPool, knex('openshift').toString());
};

export const getOpenshiftByProjectId: ResolverFn = async (
  { id: pid },
  args,
  { sqlClientPool, hasPermission, adminScopes, userActivityLogger }
) => {

  if (!adminScopes.openshiftViewAll) {
    await hasPermission('openshift', 'view', {
      project: pid
    });
  }

  const rows = await query(sqlClientPool, Sql.selectOpenshiftByProjectId(pid));

  userActivityLogger(`User queried getOpenshiftByProjectId'`, {
    project: '',
    event: 'api:getOpenshiftByProjectId',
    payload: { id: pid, args: args },
  });

  return rows ? rows[0] : null;
};

export const getOpenshiftByDeployTargetId: ResolverFn = async (
  { id: did },
  args,
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  // get the project id for the deploytarget
  const projectrows = await query(sqlClientPool, Sql.selectProjectIdByDeployTargetId(did)
  );

  // check permissions on the project
  await hasPermission('openshift', 'view', {
    project: projectrows[0].project
  });

  const rows = await query(sqlClientPool, Sql.selectOpenshiftByDeployTargetId(did));

  userActivityLogger(`User queried getOpenshiftByDeployTargetId'`, {
    project: '',
    event: 'api:getOpenshiftByDeployTargetId',
    payload: { id: did, args: args },
  });

  return rows ? rows[0] : null;
};

export const getOpenshiftByEnvironmentId: ResolverFn = async (
  { id: eid },
  args,
  { sqlClientPool, hasPermission, adminScopes, userActivityLogger }
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

  userActivityLogger(`User queried getOpenshiftByEnvironmentId'`, {
    project: '',
    event: 'api:getOpenshiftByEnvironmentId',
    payload: { id: eid, args: args },
  });

  return rows ? rows[0] : null;
};

export const updateOpenshift: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('openshift', 'update');

  const oid = input.id.toString();

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClientPool, Sql.updateOpenshift(input));
  const rows = await query(sqlClientPool, Sql.selectOpenshift(oid));

  return R.prop(0, rows);
};

export const deleteAllOpenshifts: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('openshift', 'deleteAll');

  await query(sqlClientPool, Sql.truncateOpenshift());

  // TODO: Check rows for success
  return 'success';
};
