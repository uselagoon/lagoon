import * as R from 'ramda';
import { ResolverFn } from '../';
import { Environment } from '../../resolvers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { isPatchEmpty, query, knex } from '../../util/db';
import { getProjectByEnvironmentId } from '../project/resolvers';
import { Helpers } from './helpers';
import { Sql } from './sql';
import { deployTargetBranches } from '@lagoon/commons/src/deploy-tasks';
import { Sql as EnvironmentSql } from '../environment/sql'
import { Helpers as projectHelpers } from '../project/helpers';


export const getDeployTargetConfigById = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  const deployTargetConfig = await Helpers(sqlClientPool).getDeployTargetConfigById(args.id);

  if (!deployTargetConfig) {
    return null;
  }

  // since deploytargetconfigs are associated to a project
  // re-use the existing `project:view` permissions check, since the same sorts of fields
  // are viewable by the same permissions at the project scope
  await hasPermission('project', 'view', {
    project: deployTargetConfig.project
  });

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

  // since deploytargetconfigs are associated to a project
  // re-use the existing `project:view` permissions check, since the same sorts of fields
  // are viewable by the same permissions at the project scope
  await hasPermission('project', 'view', {
    project: pid
  });

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

  // only admin can view all deployment targetconfigs for a specfic deploy target
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

export const updateEnvironmentDeployTarget: ResolverFn = async (
  root,
  input,
  utils
) => {

  const { environment, deployTarget } = input;
  const { sqlClientPool, hasPermission, userActivityLogger } = utils;
  let environmentObj =  await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(parseInt(environment));


  await hasPermission('project', 'update', {
    project: environmentObj.project
  });

  const deployTargets = await getDeployTargetConfigsByProjectId(null, {project: environmentObj.project}, utils);

  let matchesRule = false;
  let ruleMatch = null;
  if(deployTargets.length > 0) {
    let endLoop = false;
    for(let i = 0; i < deployTargets.length && !endLoop; i++) {
      let branchTarget = deployTargets[i].branches;
      switch(branchTarget) {
        case(undefined):
        case(null):
        case(true):
        case(false):
          // if any of these before a match, we're actually done
          // because we don't have a _specific_ rule
          endLoop = true;
          continue;
        break;
        default:
          let branchRegex = new RegExp(branchTarget);
          if(branchRegex.test(branchTarget)) {
            matchesRule = deployTargets[i].deployTarget == deployTarget;
            endLoop = true;
          }
          //if there's no match for this first target,
          //we continue on since there may be one at lighter weights
          continue;
      }
    }
  }

  if(matchesRule == false) {
    throw new Error("Cannot change deploy target without matching Deploy Target rule");
  }

  await query(
    sqlClientPool,
    EnvironmentSql.updateEnvironment({
      id: environment,
      patch: {
        openshift: deployTarget,
      }
    })
  );

  const projectObj = await projectHelpers(
    sqlClientPool
  ).getProjectByEnvironmentId(environment);

  userActivityLogger(`User changed DeployTarget for environment`, {
    project: projectObj.name,
    event: 'api:updateEnvironmentDeployTarget',
    payload: {
      ...input
    }
  });

  return await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(parseInt(environment));
}


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


  let id = input.id
  let project = input.project
  let weight = input.weight || 1
  let branches = input.branches || "true"
  let pullrequests = input.pullrequests || "true"

  // since deploytargetconfigs are associated to a project
  // re-use the existing `project:update` permissions check, since the same sorts of fields
  // are updateable by the same permissions at the project scope
  await hasPermission('project', 'update', {
    project: project
  });

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

  // patch the project with the message to inform a user that their project is now using deploytarget configurations
  // this is an alpha feature with no UI support, so we do this for now
  // @TODO: if this feature comes out of alpha, a UI update will need to be done to show the changes properly
  const projectRegex = await query(sqlClientPool, Sql.updateProjectBranchPullrequestRegex(project));

  const rows = await query(sqlClientPool, Sql.selectDeployTargetConfigById(insertId));

  userActivityLogger(`User added DeployTargetConfig`, {
    project: input.name || '',
    event: 'api:addDeployTargetConfig',
    payload: {
      ...input
    }
  });

  const deployTargetConfig = rows[0];

  return deployTargetConfig;
};

export const deleteDeployTargetConfig: ResolverFn = async (
  root,
  { input: { id, project } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {

  // since deploytargetconfigs are associated to a project
  // re-use the existing `project:update` permissions check, since the same sorts of fields
  // are updateable by the same permissions at the project scope
  // deleting a deploytargetconfig from a project is classed as updating the project
  await hasPermission('project', 'update', {
    project: project
  });

  try {
    await query(sqlClientPool, 'DELETE FROM deploy_target_config WHERE id = :id', {
      id,
      project
    });
  } catch (err) {
     // Not allowed to stop execution.
  }

  userActivityLogger(`User deleted DeployTargetConfig'`, {
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

  // get the projected id for a deploy config so permissions can be checked
  const deployTargetConfig = await Helpers(sqlClientPool).getDeployTargetConfigById(id);
  if (!deployTargetConfig) {
    return null;
  }
  // since deploytargetconfigs are associated to a project
  // re-use the existing `project:update` permissions check, since the same sorts of fields
  // are updateable by the same permissions at the project scope
  await hasPermission('project', 'update', {
    project: deployTargetConfig.project
  });

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

  userActivityLogger(`User updated DeployTargetConfig`, {
    event: 'api:updateDeployTargetConfig',
    payload: {
      data: withK8s
    }
  });

  return R.prop(0, withK8s);
};
