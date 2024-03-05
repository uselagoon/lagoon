
import * as R from 'ramda';
import { ResolverFn } from '..';
import { logger } from '../../loggers/logger';
import { isPatchEmpty, query, knex } from '../../util/db';
import { Helpers } from './helpers';
import { RetentionPolicy } from './types';
import { Helpers as organizationHelpers } from '../organization/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Sql } from './sql';

export const createRetentionPolicy: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('retention_policy', 'add');

  if (input.id) {
    const retpol = await Helpers(sqlClientPool).getRetentionPolicy(input.id)
    if (retpol) {
      throw new Error(
        `Retention policy with ID ${input.id} already exists`
      );
    }
  }

  // @ts-ignore
  if (!input.type) {
    throw new Error(
      'Must provide type'
    );
  }

  const retpol = await Helpers(sqlClientPool).getRetentionPolicyByName(input.name)
  if (retpol) {
    throw new Error(
      `Retention policy with name ${input.name} already exists`
    );
  }

  // convert the type to the configuration json on import after passing through the validator
  try {
    input.configuration = await RetentionPolicy().returnValidatedConfiguration(input.type, input)
  } catch (e) {
    throw new Error(
      `${e}`
    );
  }

  const { insertId } = await query(
    sqlClientPool,
    Sql.createRetentionPolicy({
    ...input,
  }));

  const row = await Helpers(sqlClientPool).getRetentionPolicy(insertId);

  userActivityLogger(`User created a retention policy`, {
    project: '',
    event: 'api:createRetentionPolicy',
    payload: {
      patch: {
        name: input.name,
        configuration: input.configuration,
      },
      data: row
    }
  });


  return { ...row, configuration: {type: row.type, ...JSON.parse(row.configuration)} };
  // return row;
};

export const updateRetentionPolicy: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('retention_policy', 'update');

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const retpol = await Helpers(sqlClientPool).getRetentionPolicy(input.id)
  if (!retpol) {
    throw new Error(
      `Retention policy does not exist`
    );
  }

  let patch = {
    name: input.patch.name
  }

  if (!input.patch[retpol.type]) {
    throw new Error(
      `Missing configuration for type ${retpol.type}, patch not provided`
    );
  }

  // convert the type to the configuration json on import after passing through the validator
  try {
    patch["configuration"] = await RetentionPolicy().returnValidatedConfiguration(retpol.type, input.patch)
  } catch (e) {
    throw new Error(
      `${e}`
    );
  }

  await Helpers(sqlClientPool).updateRetentionPolicy(input.id, patch);

  const row = await Helpers(sqlClientPool).getRetentionPolicy(input.id);

  userActivityLogger(`User updated retention policy`, {
    project: '',
    event: 'api:updateRetentionPolicy',
    payload: {
      patch: patch,
      data: row
    }
  });

  if (retpol.configuration != row.configuration) {
    // if a policy is updated, and the configuration is not the same as before the update
    // then run postRetentionPolicyUpdateHook to make sure that the policy enforcer does
    // any policy updates for any impacted projects
    const policyEnabled = input.patch[retpol.type].enabled
    await Helpers(sqlClientPool).postRetentionPolicyUpdateHook(retpol.type, retpol.id, null, !policyEnabled)
  }

  return { ...row, configuration: {type: row.type, ...JSON.parse(row.configuration)} };
  // return row;
};

export const deleteRetentionPolicy: ResolverFn = async (
  _root,
  { id: rid },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('retention_policy', 'delete');

  const retpol = await Helpers(sqlClientPool).getRetentionPolicy(rid)
  if (!retpol) {
    throw new Error(
      `Retention policy does not exist`
    );
  }

  await Helpers(sqlClientPool).deleteRetentionPolicy(rid);

  userActivityLogger(`User deleted a retention policy '${retpol.name}'`, {
    project: '',
    event: 'api:deleteRetentionPolicy',
    payload: {
      input: {
        retentionPolicy: rid
      }
    }
  });

  return 'success';
};

export const listRetentionPolicies: ResolverFn = async (
  root,
  { type, name },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('retention_policy', 'viewAll');

  let queryBuilder = knex('retention_policy');
  if (type) {
    queryBuilder = queryBuilder.and.where('type', type);
  }

  if (name) {
    queryBuilder = queryBuilder.where('name', name);
  }

  const rows = await query(sqlClientPool, queryBuilder.toString());
  return rows.map(row => ({ ...row, source: null, configuration: {type: row.type, ...JSON.parse(row.configuration)} }));
};


export const addRetentionPolicyLink: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {

  let scopeId = 0
  switch (input.scope) {
    case "global":
      await hasPermission('retention_policy', 'addGlobal');
      break;
    case "organization":
      const organization = await organizationHelpers(sqlClientPool).getOrganizationByName(input.scopeName)
      if (!organization) {
        throw new Error(
          `Organization does not exist`
        );
      }
      await hasPermission('retention_policy', 'addOrganization');
      scopeId = organization.id
      break;
    case "project":
      const project = await projectHelpers(sqlClientPool).getProjectByProjectInput({name: input.scopeName})
      if (!project) {
        throw new Error(
          `Project does not exist`
        );
      }
      await hasPermission('retention_policy', 'addProject');
      scopeId = project.id
      break;
    default:
      throw new Error(
        `No matching scope`
      );
  }

  const retpol = await Helpers(sqlClientPool).getRetentionPolicy(input.id)
  if (!retpol) {
    throw new Error(
      `Retention policy does not exist`
    );
  }

  const retpoltypes = await Helpers(sqlClientPool).getRetentionPolicyByTypeAndLink(retpol.type, scopeId, input.scope);
  if (retpoltypes) {
    throw new Error(
      `A retention policy of type ${retpol.type} is already attached to the ${input.scope}`
    );
  }

  await query(
    sqlClientPool,
    Sql.addRetentionPolicyLink(
      input.id,
      input.scope,
      scopeId,
    )
  );

  // if a policy is linked to a scope (global, organization, project)
  // then run postRetentionPolicyLinkHook to make sure that the policy enforcer does
  // any policy updates for any impacted projects
  await Helpers(sqlClientPool).postRetentionPolicyLinkHook(scopeId, input.scope, retpol.type, retpol.id, false)

  userActivityLogger(`User added a retention policy '${retpol.name}' to ${input.scope}`, {
    project: '',
    event: 'api:addRetentionPolicyOrganization',
    payload: {
      input: {
        retentionPolicy: retpol.id,
        scope: input.scope,
        scopeId: scopeId
      }
    }
  });

  const row = await Helpers(sqlClientPool).getRetentionPolicy(input.id)
  return { ...row, configuration: {type: row.type, ...JSON.parse(row.configuration)} };
};

export const removeRetentionPolicyLink: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  let scopeId = 0
  switch (input.scope) {
    case "global":
      await hasPermission('retention_policy', 'addGlobal');
      break;
    case "organization":
      const organization = await organizationHelpers(sqlClientPool).getOrganizationByName(input.scopeName)
      if (!organization) {
        throw new Error(
          `Organization does not exist`
        );
      }
      await hasPermission('retention_policy', 'addOrganization');
      scopeId = organization.id
      break;
    case "project":
      const project = await projectHelpers(sqlClientPool).getProjectByProjectInput({name: input.scopeName})
      if (!project) {
        throw new Error(
          `Project does not exist`
        );
      }
      await hasPermission('retention_policy', 'addProject');
      scopeId = project.id
      break;
    default:
      throw new Error(
        `No matching scope`
      );
  }

  const retpol = await Helpers(sqlClientPool).getRetentionPolicy(input.id);
  if (!retpol) {
    throw new Error(
      `Retention policy does not exist`
    );
  }

  const retpoltypes = await Helpers(sqlClientPool).getRetentionPoliciesByTypePolicyIDAndLink(retpol.type, input.id, scopeId, input.scope);
  if (retpoltypes.length == 0) {
    throw new Error(
      `No matching retention policy attached to this ${input.scope}`
    );
  }

  let preDeleteProjectIds = []
  if (input.scope == "global") {
    // this is calculated before the policies are removed, as it is used after removing the policy being
    // passed into the post removal update hook if required, only for global scoped policies that are being unlinked
    preDeleteProjectIds = await Helpers(sqlClientPool).getProjectIdsForAssociatedPolicyID(retpol.type, retpol.id, true)
  }

  await query(
    sqlClientPool,
    Sql.deleteRetentionPolicyLink(
      input.id,
      input.scope,
      scopeId,
    )
  );

  // if a policy is unlinked to a scope (global, organization, project)
  // then run postRetentionPolicyLinkHook or postRetentionPolicyUpdateHook to make sure that the policy enforcer does
  // any policy updates for any impacted projects
  if (input.scope != "global") {
    // if this is a standard organization or project policy unlink, then handle that with the post retention policy link hook
    // this hook knows how to check the change that impacts those two scopes
    await Helpers(sqlClientPool).postRetentionPolicyLinkHook(scopeId, input.scope, retpol.type, retpol.id, true)
  } else {
    // global policy applications when they're remove require a different calculation step that will update
    // projects that don't use any policy overrides, this is because the depth of reach of a global policy
    // is a bit trickier to calculate
    await Helpers(sqlClientPool).postRetentionPolicyUpdateHook(retpol.type, retpol.id, preDeleteProjectIds, true)
  }

  userActivityLogger(`User removed a retention policy '${retpol.name}' from organization`, {
    project: '',
    event: 'api:removeRetentionPolicyOrganization',
    payload: {
      input: {
        retentionPolicy: retpol.id,
        scope: input.scope,
        scopeId: scopeId
      }
    }
  });

  return "success"
};

// This is only called by the project resolver, so there is no need to do any permission checks
export const getRetentionPoliciesByProjectId: ResolverFn = async (
  project,
  args,
  { sqlClientPool }
) => {

  let pid = args.project;
  if (project) {
    pid = project.id;
  }
  let rows = []
  rows = await Helpers(sqlClientPool).getRetentionPoliciesByScopeWithTypeAndLink(args.type, "project", project.id);
  return rows;
};

// This is only called by the organization resolver, so there is no need to do any permission checks
export const getRetentionPoliciesByOrganizationId: ResolverFn = async (
  organization,
  args,
  { sqlClientPool }
) => {

  let oid = args.organization;
  if (organization) {
    oid = organization.id;
  }
  let rows = []
  rows = await Helpers(sqlClientPool).getRetentionPoliciesByScopeWithTypeAndLink(args.type, "organization", oid);
  return rows;
};