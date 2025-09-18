import * as R from 'ramda';
import { Pool } from 'mariadb';
import { ResolverFn } from '../';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { isPatchEmpty, query, knex } from '../../util/db';
import { Helpers } from './helpers';
import { Sql } from './sql';
import { Sql as EnvironmentSql } from '../environment/sql'
import { Helpers as projectHelpers } from '../project/helpers';
import { Helpers as organizationHelpers } from '../organization/helpers';
import { AuditType } from '@lagoon/commons/dist/types';
import { AuditLog } from '../audit/types';

export const getDeployTargetConfigById = async (
  root,
  args,
  { sqlClientPool, hasPermission, adminScopes }
) => {
  const deployTargetConfig = await Helpers(sqlClientPool).getDeployTargetConfigById(args.id);

  if (!deployTargetConfig) {
    return null;
  }

  // since deploytargetconfigs are associated to a project
  // re-use the existing `project:view` permissions check, since the same sorts of fields
  // are viewable by the same permissions at the project scope
  await projectHelpers(sqlClientPool).checkOrgProjectViewPermission(hasPermission, deployTargetConfig.project, adminScopes)

  return deployTargetConfig;
};

export const getDeployTargetConfigsByProjectId: ResolverFn = async (
    project,
    args,
  { sqlClientPool, hasPermission, keycloakGrant, models, adminScopes }
) => {

  let pid = args.project;
  if (project) {
    pid = project.id;
  }

  // since deploytargetconfigs are associated to a project
  // re-use the existing `project:view` permissions check, since the same sorts of fields
  // are viewable by the same permissions at the project scope
  await projectHelpers(sqlClientPool).checkOrgProjectViewPermission(hasPermission, pid, adminScopes)

  const rows = await query(sqlClientPool, Sql.selectDeployTargetConfigsByProjectId(pid));

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

  const rows = await query(sqlClientPool, Sql.selectDeployTargetConfigsByDeployTarget(oid));

  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  return withK8s;
};

// used to check if project within an organization has requested valid deploy target
const checkProjectDeployTargetByOrg = async (projectId: number, deployTargetId: number, sqlClientPool: Pool) => {
  const projectdata = await projectHelpers(sqlClientPool).getProjectById(projectId)
  if (projectdata.organization != null) {
    let validDeployTarget = false
    const deploytargets = await organizationHelpers(sqlClientPool).getDeployTargetsByOrganizationId(projectdata.organization);
    for (const dt of deploytargets) {
      if (dt.dtid == deployTargetId) {
        validDeployTarget = true
      }
    }
    if (!validDeployTarget) {
      throw new Error('The provided deploytarget is not valid for this organization');
    }
  }
  return projectdata
}

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

  // check the project has an organization id, if it does, check that the organization supports the requested deploytarget
  const projectData = await checkProjectDeployTargetByOrg(environmentObj.project, deployTarget, sqlClientPool)

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

  const auditLog: AuditLog = {
    resource: {
      id: environmentObj.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environmentObj.name,
    },
    linkedResource: {
      id: deployTarget.toString(),
      type: AuditType.DEPLOYTARGET,
    },
  }
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User changed DeployTarget for environment`, {
    project: '',
    event: 'api:updateEnvironmentDeployTarget',
    payload: {
      ...input,
      ...auditLog,
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

  let id = input.id
  let project = input.project
  let weight = input.weight || 1
  let branches = input.branches || "true"
  let pullrequests = input.pullrequests || "true"

  // since deploytargetconfigs are associated to a project
  // re-use the existing `project:update` permissions check, since the same sorts of fields
  // are updateable by the same permissions at the project scope
  await projectHelpers(sqlClientPool).checkOrgProjectUpdatePermission(hasPermission, project)

  // check the project has an organization id, if it does, check that the organization supports the requested deploytarget
  const projectData = await checkProjectDeployTargetByOrg(project, deployTarget, sqlClientPool)

  const { insertId } = await query(
    sqlClientPool,
    Sql.insertDeployTargetConfig({
      id,
      project,
      weight,
      deployTarget,
      branches,
      pullrequests
    })
  );

  // patch the project with the message to inform a user that their project is now using deploytarget configurations
  // this is an alpha feature with no UI support, so we do this for now
  // @TODO: if this feature comes out of alpha, a UI update will need to be done to show the changes properly
  const projectRegex = await query(sqlClientPool, Sql.updateProjectBranchPullrequestRegex(project));

  const rows = await query(sqlClientPool, Sql.selectDeployTargetConfigById(insertId));

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
    linkedResource: {
      id: insertId.toString(),
      type: AuditType.DEPLOYTARGETCONFIG,
      details: `${JSON.stringify({
        weight,
        branches,
        pullrequests,
        deployTarget,
      })}`
    },
  }
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
  userActivityLogger(`User added DeployTargetConfig`, {
    project: '',
    event: 'api:addDeployTargetConfig',
    payload: {
      ...input,
      ...auditLog,
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
  await projectHelpers(sqlClientPool).checkOrgProjectUpdatePermission(hasPermission, project)
  const projectData = await projectHelpers(
    sqlClientPool
  ).getProjectById(project);

  try {
    await query(sqlClientPool,  Sql.deleteDeployTargetConfigById(id));
  } catch (err) {
     // Not allowed to stop execution.
  }

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
    linkedResource: {
      id: id.toString(),
      type: AuditType.DEPLOYTARGETCONFIG,
    },
  }
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
  userActivityLogger(`User deleted DeployTargetConfig'`, {
    project: '',
    event: 'api:deleteDeployTargetConfig',
    payload: {
      id,
      project,
      ...auditLog,
    }
  });

  return 'success';
};

interface UpdateDeployTargetConfigPatchInput {
  branches?: string;
  deployTarget?: number;
  pullrequests?: string;
  weight?: number;
}

interface UpdateDeployTargetConfigInput {
  id: number
  patch: UpdateDeployTargetConfigPatchInput
}

interface UpdateDeployTargetConfigArgs {
  input: UpdateDeployTargetConfigInput
}

export const updateDeployTargetConfig: ResolverFn = async (
  root,
  { input: { id, patch } }: UpdateDeployTargetConfigArgs,
  { sqlClientPool, hasPermission, userActivityLogger },
) => {
  if (isPatchEmpty({ patch })) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const {
    branches,
    deployTarget,
    pullrequests,
    weight,
  } = patch;

  // get the projected id for a deploy config so permissions can be checked
  const deployTargetConfig =
    await Helpers(sqlClientPool).getDeployTargetConfigById(id);

  if (!deployTargetConfig) {
    return null;
  }

  // since deploytargetconfigs are associated to a project
  // re-use the existing `project:update` permissions check, since the same sorts of fields
  // are updateable by the same permissions at the project scope
  await projectHelpers(sqlClientPool).checkOrgProjectUpdatePermission(
    hasPermission,
    deployTargetConfig.project,
  );

  // check the project has an organization id, if it does, check that the organization supports the requested deploytarget
  const projectData = await checkProjectDeployTargetByOrg(deployTargetConfig.project, deployTarget, sqlClientPool)

  await query(
    sqlClientPool,
    Sql.updateDeployTargetConfig({
      id,
      patch: {
        weight,
        branches,
        pullrequests,
        deployTarget,
      },
    }),
  );

  const rows = await query(sqlClientPool, Sql.selectDeployTargetConfigById(id));
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
    linkedResource: {
      id: id.toString(),
      type: AuditType.DEPLOYTARGETCONFIG,
      details: `${JSON.stringify({
        weight,
        branches,
        pullrequests,
        deployTarget,
      })}`
    },
  }
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User updated DeployTargetConfig`, {
    event: 'api:updateDeployTargetConfig',
    payload: {
      data: withK8s,
      ...auditLog,
    }
  });

  return R.prop(0, withK8s);
};
