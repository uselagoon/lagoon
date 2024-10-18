
import { ResolverFn } from '..';
import { logger } from '../../loggers/logger';
import { isPatchEmpty, query, knex } from '../../util/db';
import { Helpers } from './helpers';
import { RetentionPolicy } from './types';
import { Helpers as organizationHelpers } from '../organization/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Sql } from './sql';

const createRetentionPolicy = async (sqlClientPool, hasPermission, userActivityLogger, input, type) => {
  await hasPermission('retention_policy', 'add');

  const retpol = await Helpers(sqlClientPool).getRetentionPolicyByNameAndType(input.name, type)
  if (retpol) {
    throw new Error(
      `Retention policy with name ${input.name} already exists`
    );
  }

  // convert the type to the configuration json on import after passing through the validator
  let event
  try {
    switch (type) {
      case "harbor":
        event = 'api:createHarborRetentionPolicy'
        input.configuration = await RetentionPolicy().returnValidatedHarborConfiguration(input)
        break;
      case "history":
        event = 'api:createHistoryRetentionPolicy'
        input.configuration = await RetentionPolicy().returnValidatedHistoryConfiguration(input)
        break;
      default:
        throw new Error(
          `No matching type`
        );
    }
  } catch (e) {
    throw new Error(
      `${e}`
    );
  }

  const { insertId } = await query(
    sqlClientPool,
    Sql.createRetentionPolicy({
      type: type,
    ...input,
  }));

  const row = await Helpers(sqlClientPool).getRetentionPolicy(insertId);

  userActivityLogger(`User created a ${type} retention policy`, {
    project: '',
    event: event,
    payload: {
      patch: {
        name: input.name,
        configuration: input.configuration,
      },
      data: row
    }
  });

  return { ...row, configuration: {type: row.type, ...JSON.parse(row.configuration)} };
}

export const createHarborRetentionPolicy: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  return await createRetentionPolicy(sqlClientPool, hasPermission, userActivityLogger, input, 'harbor');
};

export const createHistoryRetentionPolicy: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  return await createRetentionPolicy(sqlClientPool, hasPermission, userActivityLogger, input, 'history');
};

const updateRetentionPolicy = async (sqlClientPool, hasPermission, userActivityLogger, input, type) => {
  await hasPermission('retention_policy', 'update');

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const retpol = await Helpers(sqlClientPool).getRetentionPolicyByNameAndType(input.name, type)
  if (!retpol) {
    throw new Error(
      `Retention policy does not exist`
    );
  }

  let patch = {
    name: input.patch.name
  }

  // convert the type to the configuration json on import after passing through the validator
  let event
  try {
    switch (type) {
      case "harbor":
        event = 'api:updateHarborRetentionPolicy'
        patch["configuration"] = await RetentionPolicy().returnValidatedHarborConfiguration(input.patch)
        break;
      case "history":
        event = 'api:updateHistoryRetentionPolicy'
        patch["configuration"] = await RetentionPolicy().returnValidatedHistoryConfiguration(input.patch)
        break;
      default:
        throw new Error(
          `No matching type`
        );
    }
  } catch (e) {
    throw new Error(
      `${e}`
    );
  }

  await Helpers(sqlClientPool).updateRetentionPolicy(retpol.id, patch);

  const row = await Helpers(sqlClientPool).getRetentionPolicy(retpol.id);

  userActivityLogger(`User updated ${type} retention policy`, {
    project: '',
    event: event,
    payload: {
      patch: patch,
      data: row
    }
  });

  if (retpol.configuration != row.configuration) {
    // if a policy is updated, and the configuration is not the same as before the update
    // then run postRetentionPolicyUpdateHook to make sure that the policy enforcer does
    // any policy updates for any impacted projects
    const policyEnabled = input.patch.enabled
    await Helpers(sqlClientPool).postRetentionPolicyUpdateHook(retpol.type, retpol.id, null, !policyEnabled)
  }

  return { ...row, configuration: {type: row.type, ...JSON.parse(row.configuration)} };
}

export const updateHarborRetentionPolicy: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  return await updateRetentionPolicy(sqlClientPool, hasPermission, userActivityLogger, input, 'harbor');
};

export const updateHistoryRetentionPolicy: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  return await updateRetentionPolicy(sqlClientPool, hasPermission, userActivityLogger, input, 'history');
};

const deleteRetentionPolicy = async (sqlClientPool, hasPermission, userActivityLogger, name, type) => {
  await hasPermission('retention_policy', 'delete');

  const retpol = await Helpers(sqlClientPool).getRetentionPolicyByNameAndType(name, type)
  if (!retpol) {
    throw new Error(
      `Retention policy does not exist`
    );
  }

  let event
  switch (type) {
    case "harbor":
      event = 'api:deleteHarborRetentionPolicy'
      break;
    case "history":
      event = 'api:deleteHistoryRetentionPolicy'
      break;
    default:
      throw new Error(
        `No matching type`
      );
  }

  await Helpers(sqlClientPool).deleteRetentionPolicy(retpol.id);

  userActivityLogger(`User deleted a ${type} retention policy '${retpol.name}'`, {
    project: '',
    event: event,
    payload: {
      input: {
        retentionPolicy: retpol.id
      }
    }
  });

  return 'success';
}

export const deleteHarborRetentionPolicy: ResolverFn = async (
  _root,
  { name },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  return await deleteRetentionPolicy(sqlClientPool, hasPermission, userActivityLogger, name, 'harbor');
};

export const deleteHistoryRetentionPolicy: ResolverFn = async (
  _root,
  { name },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  return await deleteRetentionPolicy(sqlClientPool, hasPermission, userActivityLogger, name, 'history');
};

export const listAllRetentionPolicies: ResolverFn = async (
  root,
  { name, type },
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

const addRetentionPolicyLink = async (sqlClientPool, hasPermission, userActivityLogger, input, type) => {
  let scopeId = 0
  let event, prefix
  switch (type) {
    case "harbor":
      prefix = 'api:addHarbor'
      break;
    case "history":
      prefix = 'api:addHistory'
      break;
  }
  switch (input.scope) {
    case "global":
      await hasPermission('retention_policy', 'addGlobal');
      event = `${prefix}RetentionPolicyGlobal`
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
      event = `${prefix}RetentionPolicyOrganization`
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
      event = `${prefix}RetentionPolicyProject`
      break;
    default:
      throw new Error(
        `No matching scope`
      );
  }

  const retpol = await Helpers(sqlClientPool).getRetentionPolicyByNameAndType(input.name, type)
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
      retpol.id,
      input.scope,
      scopeId,
    )
  );

  // if a policy is linked to a scope (global, organization, project)
  // then run postRetentionPolicyLinkHook to make sure that the policy enforcer does
  // any policy updates for any impacted projects
  await Helpers(sqlClientPool).postRetentionPolicyLinkHook(scopeId, input.scope, retpol.type, retpol.id, false)

  userActivityLogger(`User added a ${type} retention policy '${retpol.name}' to ${input.scope}`, {
    project: '',
    event: event,
    payload: {
      input: {
        retentionPolicy: retpol.id,
        scope: input.scope,
        scopeId: scopeId
      }
    }
  });

  const row = await Helpers(sqlClientPool).getRetentionPolicy(retpol.id)
  return { ...row, configuration: {type: row.type, ...JSON.parse(row.configuration)} };
}

export const addHarborRetentionPolicyLink: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  return await addRetentionPolicyLink(sqlClientPool, hasPermission, userActivityLogger, input, 'harbor')
};

export const addHistoryRetentionPolicyLink: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  return await addRetentionPolicyLink(sqlClientPool, hasPermission, userActivityLogger, input, 'history')
};

const removeRetentionPolicyLink = async (sqlClientPool, hasPermission, userActivityLogger, input, type) => {
  let scopeId = 0
  let event, prefix
  switch (type) {
    case "harbor":
      prefix = 'api:removeHarbor'
      break;
    case "history":
      prefix = 'api:removeHistory'
      break;
  }
  switch (input.scope) {
    case "global":
      await hasPermission('retention_policy', 'addGlobal');
      event = `${prefix}RetentionPolicyGlobal`
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
      event = `${prefix}RetentionPolicyOrganization`
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
      event = `${prefix}RetentionPolicyProject`
      break;
    default:
      throw new Error(
        `No matching scope`
      );
  }

  const retpol = await Helpers(sqlClientPool).getRetentionPolicyByNameAndType(input.name, type);
  if (!retpol) {
    throw new Error(
      `Retention policy does not exist`
    );
  }

  const retpoltypes = await Helpers(sqlClientPool).getRetentionPoliciesByTypePolicyIDAndLink(retpol.type, retpol.id, scopeId, input.scope);
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
      retpol.id,
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

  userActivityLogger(`User removed a ${type} retention policy '${retpol.name}' from organization`, {
    project: '',
    event: event,
    payload: {
      input: {
        retentionPolicy: retpol.id,
        scope: input.scope,
        scopeId: scopeId
      }
    }
  });

  return "success"
}

export const removeHarborRetentionPolicyLink: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  return await removeRetentionPolicyLink(sqlClientPool, hasPermission, userActivityLogger, input, 'harbor')
};

export const removeHistoryRetentionPolicyLink: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  return await removeRetentionPolicyLink(sqlClientPool, hasPermission, userActivityLogger, input, 'history')
};

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
