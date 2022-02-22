import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, isPatchEmpty, knex } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';
import sql from '../user/sql';
import { Sql } from './sql';

const attrFilter = async (hasPermission, entity) => {
  try {
    await hasPermission('openshift', 'view:token');
    return entity;
  } catch (err) {
    return R.omit(['token'], entity);
  }
};

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
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('openshift', 'viewAll');

  return query(sqlClientPool, 'SELECT * FROM openshift');
};

export const getOpenshiftByProjectId: ResolverFn = async (
  { id: pid },
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('openshift', 'view', {
    project: pid
  });

  const rows = await query(
    sqlClientPool,
    `SELECT o.*
    FROM project p
    JOIN openshift o ON o.id = p.openshift
    WHERE p.id = :pid
    `,
    {
      pid
    }
  );

  return rows ? attrFilter(hasPermission, rows[0]) : null;
};

export const getOpenshiftByDeployTargetId: ResolverFn = async (
  { id: did },
  args,
  { sqlClientPool, hasPermission }
) => {
  // get the project id for the deploytarget
  const projectrows = await query(
    sqlClientPool,
    `SELECT d.project
    FROM deploy_target_config d
    WHERE d.id = :did
    `,
    {
      did
    }
  );

  // check permissions on the project
  await hasPermission('openshift', 'view', {
    project: projectrows[0].project
  });

  const rows = await query(
    sqlClientPool,
    `SELECT o.*
    FROM deploy_target_config d
    JOIN openshift o ON o.id = d.deploy_target
    WHERE d.id = :did
    `,
    {
      did
    }
  );

  return rows ? attrFilter(hasPermission, rows[0]) : null;
};

export const getOpenshiftByEnvironmentId: ResolverFn = async (
  { id: eid },
  args,
  { sqlClientPool, hasPermission }
) => {
  // get the project id for the environment
  const { id: projectId } = await projectHelpers(
    sqlClientPool
  ).getProjectByEnvironmentId(eid);
  // check permissions on the project
  await hasPermission('openshift', 'view', {
    project: projectId
  });

  const rows = await query(
    sqlClientPool,
    `SELECT o.*
    FROM environment e
    JOIN openshift o ON o.id = e.openshift
    WHERE e.id = :eid
    `,
    {
      eid
    }
  );

  return rows ? attrFilter(hasPermission, rows[0]) : null;
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
