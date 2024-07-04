import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, isPatchEmpty, knex } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';
import { Sql } from './sql';
import { AuditType } from '@lagoon/commons/dist/types';
import { AuditLog } from '../audit/types';

export const getToken: ResolverFn = async (
  kubernetes,
  _args,
  { hasPermission, userActivityLogger }
) => {
  try {
    await hasPermission('openshift', 'view:token');

    const auditLog: AuditLog = {
      resource: {
        id: kubernetes.id,
        type: AuditType.DEPLOYTARGET,
        details: kubernetes.name,
      },
    };
    userActivityLogger(`User viewed openshift token`, {
      project: '',
      event: 'api:viewOpenshiftToken',
      payload: {
        name: kubernetes.name,
        id: kubernetes.id,
        ...auditLog,
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

  const auditLog: AuditLog = {
    resource: {
      id: R.prop(0, rows).id,
      type: AuditType.DEPLOYTARGET,
      details: R.prop(0, rows).name,
    },
  };
  userActivityLogger(`User added a deploytarget '${input.name}'`, {
    project: '',
    event: 'api:addOpenshift',
    payload: {
      name: input.name,
      id: R.prop(0, rows).id,
      ...auditLog,
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

  const rows = await query(sqlClientPool, Sql.selectOpenshiftByName(input.name));

  res = await query(sqlClientPool, knex('openshift').where('name', input.name).delete().toString());

  const auditLog: AuditLog = {
    resource: {
      id: R.prop(0, rows).id,
      type: AuditType.DEPLOYTARGET,
      details: R.prop(0, rows).name,
    },
  };
  userActivityLogger(`User deleted a deploytarget '${input.name}'`, {
    project: '',
    event: 'api:deleteOpenshift',
    payload: {
      name: input.name,
      ...auditLog,
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

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
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

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
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

  const auditLog: AuditLog = {
    resource: {
      id: R.prop(0, rows).id,
      type: AuditType.DEPLOYTARGET,
      details: R.prop(0, rows).name,
    },
  };
  userActivityLogger(`User updated an openshift '${R.prop(0, rows).name}'`, {
    project: '',
    event: 'api:updateOpenshift',
    payload: {
      name: R.prop(0, rows).name,
      id: R.prop(0, rows).id,
      ...auditLog,
    }
  });

  return R.prop(0, rows);
};
