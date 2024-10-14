import * as R from 'ramda';
import { Pool } from 'mariadb';
import { asyncPipe } from '@lagoon/commons/dist/util/func';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Sql as organizationSql } from '../organization/sql';
import { Sql as projectSql } from '../project/sql';
import { logger } from '../../loggers/logger';
import { Helpers as projectHelpers } from '../project/helpers';
import { HarborRetentionEnforcer } from './harbor';

export const Helpers = (sqlClientPool: Pool) => {
  const getRetentionPolicy = async (id: number) => {
    const rows = await query(sqlClientPool, Sql.selectRetentionPolicyById(id));
    return R.prop(0, rows);
  };
  const getRetentionPolicyByName = async (name: string) => {
    const rows = await query(sqlClientPool, Sql.selectRetentionPolicyByName(name));
    return R.prop(0, rows);
  };
  const getRetentionPolicyByNameAndType = async (name: string, type: string) => {
    const rows = await query(sqlClientPool, Sql.selectRetentionPolicyByNameAndType(name, type));
    return R.prop(0, rows);
  };
  const getRetentionPolicyByTypeAndLink = async (type: string, sid: number, scope: string) => {
    const rows = await query(sqlClientPool, Sql.selectRetentionPoliciesByTypeAndLink(type, sid, scope));
    return R.prop(0, rows); // ? R.prop(0, rows) : null;
  };
  const getRetentionPoliciesByTypePolicyIDAndLink = async (type: string, policyId: number, sid: number, scope: string) => {
    const rows = await query(sqlClientPool, Sql.selectRetentionPoliciesByTypePolicyIDAndLink(type, policyId, sid, scope));
    return rows;
  };
  const getRetentionPoliciesByProjectWithType = async (type: string, project: number) => {
    let rows = []
    if (type) {
      rows = await query(sqlClientPool, Sql.selectRetentionPoliciesByTypeAndLink(type, project, "project"));
    } else {
      rows = await query(sqlClientPool, Sql.selectRetentionPoliciesByLink(project, "project"));
    }
    return rows;
  };
  const getRetentionPoliciesByOrganizationWithType = async (type: string, organization: number) => {
    let rows = []
    if (type) {
      rows = await query(sqlClientPool, Sql.selectRetentionPoliciesByTypeAndLink(type, organization, "organization"));
    } else {
      rows = await query(sqlClientPool, Sql.selectRetentionPoliciesByLink(organization, "organization"));
    }
    return rows;
  };
  const getRetentionPoliciesByGlobalWithType = async (type: string) => {
    let rows = []
    if (type) {
      rows = await query(sqlClientPool, Sql.selectRetentionPoliciesByTypeAndLink(type, 0, "global"));
    } else {
      rows = await query(sqlClientPool, Sql.selectRetentionPoliciesByLink(0, "global"));
    }
    return rows;
  };
  const getRetentionPoliciesByScopeWithTypeAndLink = async (type: string, scope: string, scopeId: number) => {
    let rows, gr, or, pr, orgRows = []
    const globalRows = await getRetentionPoliciesByGlobalWithType(type);
    switch (scope) {
      case "project":
        const projectData = await projectHelpers(sqlClientPool).getProjectById(scopeId)
        orgRows = await getRetentionPoliciesByOrganizationWithType(type, projectData.organization);
        const pRows = await getRetentionPoliciesByProjectWithType(type, scopeId);
        gr = globalRows.map(row => ({ ...row, source: "global", configuration: {type: row.type, ...JSON.parse(row.configuration)} }))
        or = orgRows.map(row => ({ ...row, source: "organization", configuration: {type: row.type, ...JSON.parse(row.configuration)} }))
        pr = pRows.map(row => ({ ...row, source: "project", configuration: {type: row.type, ...JSON.parse(row.configuration)} }))
        if (pr.length == 0) {
          rows = gr.filter(ar => !or.find(rm => (rm.type === ar.type ) ))
          if (or.length != 0) {
            rows = or.filter(ar => !pr.find(rm => (rm.type === ar.type ) ))
          }
        } else {
          return pr
        }
        rows.push(...pr)
        return rows;
      case "organization":
        orgRows = await getRetentionPoliciesByOrganizationWithType(type, scopeId);
        gr = globalRows.map(row => ({ ...row, source: "global", configuration: {type: row.type, ...JSON.parse(row.configuration)} }))
        or = orgRows.map(row => ({ ...row, source: "organization", configuration: {type: row.type, ...JSON.parse(row.configuration)} }))
        rows = gr.filter(ar => !or.find(rm => (rm.type === ar.type ) ))
        rows.push(...or)
        return rows;
      case "global":
        return globalRows.map(row => ({ ...row, source: "global", configuration: {type: row.type, ...JSON.parse(row.configuration)} }))
      default:
        throw new Error(
            `No matching scope`
        );
    }
  };
  const getDeployTargetsForRetentionPoliciesByProject = async (project: number) => {
    const rows = await query(sqlClientPool, Sql.selectDeployTargetsForRetentionByProject(project));
    return rows;
  };
  const getEnvironmentsForRetentionPoliciesByProject = async (project: number) => {
    const rows = await query(sqlClientPool, Sql.selectEnvironmentsForRetentionByProject(project));
    return rows;
  };
  /*
    getProjectIdsForAssociatedPolicyID retrieves all project ids that have the associated policyid and type attached either globally, organizationally, or directly in the project
    this is used to quickly figure out which projects need to be updated if the associated policy is modified
    the data this generates should be in the format the `policyEnforcer` requires, see `policyEnforcer` for details
  */
  const getProjectIdsForAssociatedPolicyID = async (type: string, policyId: number, removal: boolean) => {
    let policyOverrides = [] // store all the policy overrides that this function will generate
    let projects = [] // store all the collected project ids so that we can use it to select other projects not in this list later on
    // this policy is applied globally, so check for any organizations or projects that may use this policy
    // check if any organizations have a policy that is different to this updated policy, these should be excluded from receiving any updates
    const oids = await query(sqlClientPool, Sql.selectScopeIDsByRetentionPolicyTypeExcludingPolicyID(type, "organization", policyId));
      if (oids.length != 0 && oids[0]["scopeIds"] != null) {
      for (const oid of oids[0]["scopeIds"].split(',')) {
        const opids = await query(sqlClientPool, organizationSql.selectOrganizationProjectIds(oid))
        if (opids[0]["projectIds"] != null) {
          for (const pid of opids[0]["projectIds"].split(',')) {
            projects.push(pid)
            const d = await getRetentionPolicyByTypeAndLink(type, oid, "organization")
            if (removal && d && d.id == policyId) {
              const targetIndex = policyOverrides.findIndex(f=>f.pid===pid);
              const policy = {pid: pid, updatePolicy: true, rpid: d.id}
              if (targetIndex != -1) {
                // if the project already exists in the overrides, but a change is determined to be made
                // update the project with the new policy
                policyOverrides[targetIndex] = policy;
              } else {
                // otherwise add the project and policy as a new item
                policyOverrides.push(policy)
              }
            }
          }
        }
      }
    }
    // check if any projects have a policy that is different to this updated policy, these should be excluded from receiving any updates
    const pids = await query(sqlClientPool, Sql.selectScopeIDsByRetentionPolicyTypeExcludingPolicyID(type, "project", policyId));
    if (pids.length != 0 && pids[0]["scopeIds"] != null) {
      for (const pid of pids[0]["scopeIds"].split(',')) {
        projects.indexOf(pid) === -1 && projects.push(pid);
        const d = await getRetentionPolicyByTypeAndLink(type, pid, "project")
        if (removal && d && d.id == policyId) {
          const targetIndex = policyOverrides.findIndex(f=>f.pid===pid);
          const policy = {pid: pid, updatePolicy: true, rpid: d.id}
          if (targetIndex != -1) {
            // if the project already exists in the overrides, but a change is determined to be made
            // update the project with the new policy
            policyOverrides[targetIndex] = policy;
          } else {
            // otherwise add the project and policy as a new item
            policyOverrides.push(policy)
          }
        }
      }
    }
    // select all project ids that don't have a policy override
    const updateProjects = await query(sqlClientPool, projectSql.selectAllProjectIDsNotIn(projects))
    if (updateProjects[0]["projectIds"] != null) {
      const projects = updateProjects[0]["projectIds"].split(',');
      for (const pid of projects) {
        if (removal) {
          // if the project has no other policies to apply
          // then it need to have any policies that may have been attached to it, removed from it
          // set that here for the policyEnforcer to consume
          policyOverrides.push({pid: pid, removePolicy: true})
        } else {
          policyOverrides.push({pid: pid, updatePolicy: true, rpid: policyId})
        }
      }
    }
    // all of these project ids should get an update as long as the policy type requires immediate update changes
    return policyOverrides
  }
  /*
    getRetentionPolicyChangesRequiredByScope generates a list of project ids and the associated policy id that should be attached to this project
    the data this generates should be in the format the `policyEnforcer` requires, see `policyEnforcer` for details
  */
  const getRetentionPolicyChangesRequired = async (scopeId: number, scope: string, type: string, policyId: number, removal: boolean) => {
    const globPols = await getRetentionPoliciesByScopeWithTypeAndLink(type, "global", 0)
    let policyOverrides = [] // projects with override policies
    switch (scope) {
      case "global":
        const projects = await getProjectIdsForAssociatedPolicyID(type, policyId, removal)
        for (const p of projects) {
          policyOverrides.push(p)
        }
        break;
      case "organization":
        const orgProjects = await query(sqlClientPool, organizationSql.selectOrganizationProjects(scopeId))
        let skip = false
        for (const p of orgProjects) {
          const pRetPols = await getRetentionPoliciesByScopeWithTypeAndLink(type, "project", p.id)
          for (const rp of pRetPols) {
            skip = true
            switch (rp.source) {
              case "global":
                // if this policy is being removed from an organization, and there is a global policy that can be applied
                // set that here
                if (removal) {
                  if (rp.configuration.enabled) {
                    policyOverrides.push({pid: p.id, updatePolicy: true, rpid: rp.id})
                  } else {
                    policyOverrides.push({pid: p.id, removePolicy: true})
                  }
                }
                break;
              case "organization":
                // if this policy is being added to an organization, and there is a an organization policy that can be applied
                // set that here
                if (!removal) {
                  if (rp.configuration.enabled) {
                    policyOverrides.push({pid: p.id, updatePolicy: true, rpid: rp.id})
                  } else {
                    policyOverrides.push({pid: p.id, removePolicy: true})
                  }
                }
                break;
              case "project":
                // do nothing if the project has an override for the project, as it takes precedence
                break;
            }
          }
          if (!skip) {
            // if the project has no other policies to apply
            // then it need to have any policies that may have been attached to it, removed from it
            // set that here for the policyEnforcer to consume
            policyOverrides.push({pid: p.id, removePolicy: true})
          }
          skip = false
        }
        break;
      case "project":
        let policyToApply = null
        const projectData = await projectHelpers(sqlClientPool).getProjectById(scopeId)
        const orgRows = await getRetentionPoliciesByOrganizationWithType(type, projectData.organization);
        const pRetPols = await getRetentionPoliciesByScopeWithTypeAndLink(type, "project", scopeId)
        if (pRetPols.length == 1) {
          policyToApply = pRetPols[0]
        } else {
          if (orgRows.length == 1) {
            policyToApply = orgRows[0]
          } else {
            if (globPols.length == 1) {
              // apply the global polcy
              policyToApply = globPols[0]
            }
          }
        }
        // if there is a policy to apply, and it is enabled, enable it here
        if (policyToApply && policyToApply.configuration.enabled) {
          policyOverrides.push({pid: scopeId, updatePolicy: true, rpid: policyToApply.id})
        } else {
          // if the project has no other policies to apply
          // then it need to have any policies that may have been attached to it, removed from it
          // set that here for the policyEnforcer to consume
          policyOverrides.push({pid: scopeId, removePolicy: true})
        }
        break;
      default:
        throw new Error(
          `No matching scope`
        );
    }
    return policyOverrides
  }
  const postRetentionPolicyUpdateHook = async (type: string, policyId: number, policyChanges: any, removal: boolean = false) => {
    // retrieve all projects that need to be updated if a change in the policy is made
    // not all policies will require immediate updates, but those that do will be done here
    if (!policyChanges) {
      policyChanges = await getProjectIdsForAssociatedPolicyID(type, policyId, removal)
    }
    await policyEnforcer(policyChanges, type)
  }
  // this hook can be used to perform actions when a policy is added to or removed from a scope
  // depending on the scope
  const postRetentionPolicyLinkHook = async (scopeId: number, scope: string, type: string, policyId: number, removal: boolean = false) => {
    const policyChanges = await getRetentionPolicyChangesRequired(scopeId, scope, type, policyId, removal)
    await policyEnforcer(policyChanges, type)
  }
  /*
    policyEnforcer is the actual policy enforcement function, it will handle execution of policy changes that are required, if they are required.
    the payload of `policyChanges` is as follows
    [
      {pid: project.id, removePolicy: true},
      {pid: project.id, updatePolicy: true, rpid: policy.id}
    ]
    `removePolicy` indicates that any policies on this project of the requested type should be removed from this project
    `updatePolicy` indicates that a policy of the requested type should be applied to this project
    the post retention hooks (postRetentionPolicyLinkHook and postRetentionPolicyUpdateHook) will call policyEnforcer based on which resolver
    called the hook (addRetentionPolicyLink, updateRetentionPolicy, removeRetentionPolicyLink)
  */
  const policyEnforcer =async (policyChanges: any, type: string) => {
    switch (type) {
      case "harbor":
        // send this to the harbor retention policy enforcer
        await HarborRetentionEnforcer().updateProjects(sqlClientPool, policyChanges)
        break;
      case "history":
        // do nothing, history changes are executed when deployment or task history is modified
        // so policy updates are implemented in realtime
        break;
      default:
        throw new Error(
          `No matching type`
        );
    }
  }
  // this hook can be used after a deployment has been updated to perform changes to any retention policies as required
  const postDeploymentProjectPolicyHook = async (projectId: number, status: string ) => {
    switch (status) {
      case 'complete':
      case 'failed':
      case 'cancelled':
        const rows = await getRetentionPoliciesByScopeWithTypeAndLink("harbor", "project", projectId);
        if (rows[0]) {
          // if a deployment is complete, cancelled, or fails, run the postretentionpolicylinkhook so that
          // any harbor policies are applied to the new environment or project as required
          // this is done just in case the project or environment was created AFTER the policy was created to ensure that it gets any updates
          // additionally, it happens here rather than at project creation as there may be no harbor project at the time the project is created
          await postRetentionPolicyLinkHook(projectId, "project", rows[0].type, rows[0].id, !rows[0].configuration.enabled)
        }
        break;
      default:
        break;
    }
  }
  return {
    getRetentionPolicy,
    getRetentionPolicyByName,
    getRetentionPolicyByNameAndType,
    getRetentionPoliciesByProjectWithType,
    getRetentionPoliciesByOrganizationWithType,
    getRetentionPoliciesByGlobalWithType,
    getDeployTargetsForRetentionPoliciesByProject,
    getEnvironmentsForRetentionPoliciesByProject,
    getRetentionPolicyByTypeAndLink,
    getRetentionPoliciesByTypePolicyIDAndLink,
    getProjectIdsForAssociatedPolicyID,
    getRetentionPolicyChangesRequired,
    postRetentionPolicyLinkHook,
    postRetentionPolicyUpdateHook,
    policyEnforcer,
    getRetentionPoliciesByScopeWithTypeAndLink,
    postDeploymentProjectPolicyHook,
    deleteRetentionPolicy: async (id: number) => {
      // check for globals with this retention policy
      const globals = await query(
        sqlClientPool, Sql.selectRetentionPoliciesByLinkAndPolicyID(id, "global")
      );
      if (globals.length > 0) {
        throw new Error(
          'Unable to delete retention policy, it is in use globally and should be removed from global consumption first'
        );
      }

      // check for organizations with this retention policy
      const orgs = await query(
        sqlClientPool, Sql.selectRetentionPoliciesByLinkAndPolicyID(id, "organization")
      );
      if (orgs.length > 0) {
        throw new Error(
          'Unable to delete retention policy, there are organizations using it that should be removed from first'
        );
      }

      // check for organizations with this retention policy
      const projects = await query(
        sqlClientPool, Sql.selectRetentionPoliciesByLinkAndPolicyID(id, "project")
      );
      if (projects.length > 0) {
        throw new Error(
          'Unable to delete retention policy, there are projects using it that should be removed from first'
        );
      }
      await query(
        sqlClientPool,
        Sql.deleteRetentionPolicy(id)
      );
    },
    updateRetentionPolicy: async (id: number, patch: any) => {
      await query(
        sqlClientPool,
        Sql.updateRetentionPolicy({
          id: id,
          patch: patch
        })
      );
    }
  };
};
