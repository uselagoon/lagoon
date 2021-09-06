import * as R from 'ramda';
// @ts-ignore
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
// @ts-ignore
import { createRemoveTask } from '@lagoon/commons/dist/tasks';
import { ResolverFn } from '../';
import { isPatchEmpty, query, knex } from '../../util/db';
import convertDateToMYSQLDateTimeFormat from '../../util/convertDateToMYSQLDateTimeFormat';
import { Helpers } from './helpers';
import { Sql } from './sql';
import { Sql as projectSql } from '../project/sql';
import { Helpers as projectHelpers } from '../project/helpers';
import { logger } from '../../loggers/logger';


export const getDeployTargetConfigById = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  const deployTargetConfig = await Helpers(sqlClientPool).getDeployTargetConfigById(args.id);

  if (!deployTargetConfig) {
    return null;
  }

  // only admin can add deployment targets for now
  await hasPermission('project', `viewAll`);

  return deployTargetConfig;
};

export const getDeployTargetConfigsByProjectId: ResolverFn = async (
    project,
    args,
  { sqlClientPool, hasPermission, keycloakGrant, models }
) => {

  let pid = args.project;
  if (project) {
    pid = project.id;
  }

  // only admin can add deployment targets for now
  await hasPermission('project', `viewAll`);

  const rows = await query(
    sqlClientPool,
    `SELECT *
    FROM deploy_target_config d
    WHERE d.project = :pid ORDER BY d.weight DESC`,
    { pid }
  );
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  return withK8s;
};

export const getDeployTargetConfigsByDeployTarget: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  let oid = args.deployTarget;

  // only admin can add deployment targets for now
  await hasPermission('project', `viewAll`);

  const rows = await query(
    sqlClientPool,
    `SELECT d.*
    FROM
    deploy_target_config d
    WHERE d.deploy_target = :oid`,
    { oid }
  );

  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  return withK8s;
};

// export const getDeployTargetConfigsByKubernetes: ResolverFn = async (
//   root,
//   args,
//   ctx
// ) =>
// getDeployTargetConfigsByDeployTarget(
//     root,
//     {
//       ...args,
//       openshift: args.kubernetes
//     },
//     ctx
//   );

export const addDeployTargetConfig: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {

  const deployTarget = input.deployTarget ;
  if (!deployTarget) {
    throw new Error('Must provide deployTarget field');
  }
  const deployTargetProjectPattern = input.deployTargetProjectPattern;

  // only admin can add deployment targets for now
  await hasPermission('project', `viewAll`);

  let id = input.id
  let project = input.project
  let weight = input.weight || 1
  let branches = input.branches || "true"
  let pullrequests = input.pullrequests || "true"

  const { insertId } = await query(
    sqlClientPool,
    Sql.insertDeployTargetConfig({
      id,
      project,
      weight,
      deployTarget,
      deployTargetProjectPattern,
      branches,
      pullrequests
    })
  );

  const rows = await query(sqlClientPool, Sql.selectDeployTargetConfigById(insertId));

  userActivityLogger.user_action(`User added DeployTargetConfig`, {
    project: input.name || '',
    event: 'api:addDeployTargetConfig',
    payload: {
      ...input
    }
  });

//   const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s([
//     R.path([0, 0], rows)
//   ]);
  const deployTargetConfig = rows[0];
  logger.info(`${JSON.stringify(deployTargetConfig)}`)

  return deployTargetConfig;
};

export const deleteDeployTargetConfig: ResolverFn = async (
  root,
  { input: { id, project } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {

  // only admin can delete deployment targets for now
  await hasPermission('project', `viewAll`);
  logger.info(`${id} ${project}`)
  try {
    await query(sqlClientPool, 'DELETE FROM deploy_target_config WHERE id = :id', {
      id,
      project
    });
  } catch (err) {
     // Not allowed to stop execution.
  }

  userActivityLogger.user_action(`User deleted DeployTargetConfig'`, {
    project: project || '',
    event: 'api:deleteEnvironment',
    payload: {
      id,
      project,
    }
  });

  return 'success';
};

export const updateDeployTargetConfig: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const id = input.id;
  const deployTarget = input.patch.deployTarget;
  const deployTargetProjectPattern = input.patch.deployTargetNamespacePattern;

  // only admin can update deployment targets for now
  await hasPermission('project', `viewAll`);

  await query(
    sqlClientPool,
    Sql.updateDeployTargetConfig({
      id,
      patch: {
        weight: input.patch.weight,
        branches: input.patch.branches,
        pullrequests: input.patch.pullrequests,
        deployTarget,
        deployTargetProjectPattern,
      }
    })
  );

  const rows = await query(sqlClientPool, Sql.selectDeployTargetConfigById(id));
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  userActivityLogger.user_action(`User updated DeployTargetConfig`, {
    event: 'api:updateDeployTargetConfig',
    payload: {
      data: withK8s
    }
  });

  return R.prop(0, withK8s);
};

export const getAllDeployTargetConfigs: ResolverFn = async (
  root,
  { order },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('project', 'viewAll');

  let queryBuilder = knex('deploy_target_config');

  const rows = await query(sqlClientPool, queryBuilder.toString());
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  return withK8s;
};

export const deleteAllDeployTargetConfigs: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('project', 'deleteAll');

  await query(sqlClientPool, Sql.truncateDeployTargetConfigs());

  userActivityLogger.user_action(`User deleted all deployTargetConfigs'`, {
    project: '',
    event: 'api:deleteAllDeployTargetConfigs',
    payload: {
      args
    }
  });

  // TODO: Check rows for success
  return 'success';
};
