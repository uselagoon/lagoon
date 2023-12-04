// @ts-ignore
import * as R from 'ramda';
import { ResolverFn } from '../';
import { logger } from '../../loggers/logger';
import { query, isPatchEmpty, knex } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';
import { Helpers} from './helpers';
import { Sql } from './sql';
import { arrayDiff } from '../../util/func';
import { Helpers as openshiftHelpers } from '../openshift/helpers';
import { Helpers as notificationHelpers } from '../notification/helpers';
import { Helpers as groupHelpers } from '../group/helpers';
import validator from 'validator';
import { log } from 'winston';

const isValidName = value => {
  if (validator.matches(value, /[^0-9a-z-]/)) {
    throw new Error(
      'Only lowercase characters, numbers and dashes allowed for name!'
    );
  }
  if (validator.matches(value, /--/)) {
    throw new Error('Multiple consecutive dashes are not allowed for name!');
  }
}

export const addOrganization: ResolverFn = async (
  args,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {

  // check if the name is valid
  isValidName(input.name)

  try {
    await hasPermission('organization', 'add');
    const org = await query(sqlClientPool, Sql.selectOrganizationByName(input.name));
    // if no organization found, create it
    if (R.length(org) == 0) {
      const { insertId } = await query(sqlClientPool, Sql.insertOrganization(input));
      const rows = await query(sqlClientPool, Sql.selectOrganization(insertId));

      userActivityLogger(`User added an organization ${R.prop(0, rows).name}`, {
        project: '',
        organization: input.organization,
        event: 'api:addOrganization',
        payload: {
          data: {
            input
          }
        }
      });

      return R.prop(0, rows);
    } else {
      throw new Error(`There was an error creating the organization, ${input.name} already exists`);
    }
  }  catch (err) {
    throw new Error(`There was an error creating the organization ${input.name} ${err}`);
  }
};


export const addDeployTargetToOrganization: ResolverFn = async (
  args,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('organization', 'add');

  const org = await query(sqlClientPool, Sql.selectOrganization(input.organization));
  if (R.length(org) == 0) {
    throw new Error(
      `Organization doesn't exist`
    );
  }
  try {
    await openshiftHelpers(sqlClientPool).getOpenshiftByOpenshiftInput({id: input.deployTarget})
  }  catch (err) {
    throw new Error(`There was an error adding the deployTarget: ${err}`);
  }
  const result = await query(sqlClientPool, Sql.selectDeployTargetsByOrganizationAndDeployTarget(input.organization, input.deployTarget))
  if (R.length(result) >= 1) {
    throw new Error(
      `Already added to organization`
    );
  }
  try {
      await query(sqlClientPool, Sql.addDeployTarget({dtid: input.deployTarget, orgid: input.organization}));
  }  catch (err) {
      throw new Error(`There was an error adding the deployTarget: ${err}`);
  }
  userActivityLogger(`User added a deploytarget to organization ${R.prop(0, org).name}`, {
    project: '',
    organization: input.organization,
    event: 'api:addDeployTargetToOrganization',
    payload: {
      data: {
        input
      }
    }
  });

  return org[0];
};

export const removeDeployTargetFromOrganization: ResolverFn = async (
  args,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('organization', 'add');

  const org = await query(sqlClientPool, Sql.selectOrganization(input.organization));
  if (R.length(org) == 0) {
    throw new Error(
      `Organization doesn't exist`
    );
  }

  try {
    await query(sqlClientPool, Sql.removeDeployTarget(input.organization, input.deployTarget));
  }  catch (err) {
    throw new Error(`There was an error removing the deployTarget: ${err}`);
  }

  userActivityLogger(`User removed a deploytarget from organization ${R.prop(0, org).name}`, {
    project: '',
    organization: input.organization,
    event: 'api:removeDeployTargetFromOrganization',
    payload: {
      data: {
        input
      }
    }
  });

  return org[0];
};


export const getDeployTargetsByOrganizationId: ResolverFn = async (
  { id: oid },
  args,
  { sqlClientPool, hasPermission }
) => {
  // let oid = args.organization;
  if (args.organization) {
    oid = args.organization;
  }

  await hasPermission('organization', 'view', {
      organization: oid,
  });

  const rows = await query(sqlClientPool, Sql.selectDeployTargetsByOrganization(oid));

  if (!rows) {
      return null;
  }

  return rows;
};

export const getEnvironmentsByOrganizationId: ResolverFn = async (
  { id: oid },
  args,
  { sqlClientPool, hasPermission }
) => {
  // let oid = args.organization;
  if (args.organization) {
    oid = args.organization;
  }
  await hasPermission('organization', 'view', {
      organization: oid,
  });

  const rows = await query(sqlClientPool, Sql.selectOrganizationEnvironments(oid));

  if (!rows) {
      return null;
  }

  return rows;
};

export const updateOrganization: ResolverFn = async (
    root,
    { input },
    { sqlClientPool, hasPermission, userActivityLogger }
) => {

    if (input.patch.quotaProject || input.patch.quotaGroup || input.patch.quotaNotification || input.patch.quotaEnvironment || input.patch.quotaRoute) {
      await hasPermission('organization', 'update');
    } else {
      await hasPermission('organization', 'updateOrganization', input.id);
    }

    if (input.patch.name) {
      // check if the name is valid
      isValidName(input.patch.name)
    }

    const oid = input.id.toString();

    if (isPatchEmpty(input)) {
      throw new Error('input.patch requires at least 1 attribute');
    }

    await query(sqlClientPool, Sql.updateOrganization(input));
    const rows = await query(sqlClientPool, Sql.selectOrganization(oid));

    userActivityLogger(`User updated organization ${R.prop(0, rows).name}`, {
      project: '',
      organization: input.organization,
      event: 'api:updateOrganization',
      payload: {
        data: {
          input
        }
      }
    });

    return R.prop(0, rows);
};

export const getOrganizationById: ResolverFn = async (
    id,
    args,
    { sqlClientPool, hasPermission }
) => {
    let oid = args.id;
    if (id) {
      oid = id;
    }

    await hasPermission('organization', 'view', {
      organization: oid,
    });

    const rows = await query(sqlClientPool, Sql.selectOrganization(oid));
    const orgResult = rows[0];

    if (!orgResult) {
        return null;
    }

    return orgResult;
};

export const getOrganizationByName: ResolverFn = async (
  name,
  args,
  { sqlClientPool, hasPermission }
) => {
  let orgName = args.name;
  if (name) {
    orgName = name;
  }

  const rows = await query(sqlClientPool, Sql.selectOrganizationByName(orgName));
  const orgResult = rows[0];

  if (!orgResult) {
    return null;
  }

  await hasPermission('organization', 'view', {
    organization: orgResult.id,
  });

  return orgResult;
};

export const getAllOrganizations: ResolverFn = async (
    root,
    args,
    { sqlClientPool, models, hasPermission, keycloakGrant }
) => {
    let userOrganizationIds: number[];

    try {
      await hasPermission('organization', 'viewAll');
    } catch (err) {
      if (!keycloakGrant) {
        logger.warn('No grant available for getAllProjects');
        return [];
      }

      userOrganizationIds = await models.UserModel.getAllOrganizationIdsForUser({
        id: keycloakGrant.access_token.content.sub
      });
    }

    let queryBuilder = knex('organization');

    if (userOrganizationIds) {
      queryBuilder = queryBuilder.whereIn('id', userOrganizationIds);
    }
    const rows = await query(sqlClientPool, queryBuilder.toString());
    return rows;
};

// get projects by organization id, used by organization resolver to list projects
// this resolver is only ever called by an organization top resolver for projects, so the permission has already been checked at the organization level
// no need to performpermission checks for this sub resolver
export const getProjectsByOrganizationId: ResolverFn = async (
  { id: oid },
  args,
  { sqlClientPool, hasPermission }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectOrganizationProjects(oid)
  );
  return rows;
};

// get notifications by organization id and project id, used by organization resolver to list projects notifications
// this resolver is only ever called by an organization top resolver for notifications, so the permission has already been checked at the organization level
// no need to performpermission checks for this sub resolver
export const getNotificationsForOrganizationProjectId: ResolverFn = async (
  organization,
  args,
  { sqlClientPool, hasPermission }
) => {
  let oid = args.organization;
  if (organization) {
    oid = organization.organization;
  }
  let pid = args.organization;
  if (organization) {
    pid = organization.id;
  }

  return await notificationHelpers(sqlClientPool).selectNotificationsByProjectId({project: pid})
};

// gets owners of an organization by id
export const getOwnersByOrganizationId: ResolverFn = async (
  { id: oid },
  _input,
  { hasPermission, models }
) => {
  await hasPermission('organization', 'view', {
    organization: oid,
  });
  const orgUsers = await models.UserModel.loadUsersByOrganizationId(oid);
  return orgUsers;
};

// list all groups by organization id
export const getGroupsByOrganizationId: ResolverFn = async (
  { id: oid },
  _input,
  { hasPermission, models, sqlClientPool }
) => {
  await hasPermission('organization', 'viewGroup', {
    organization: oid,
  });

  const orgGroups = await groupHelpers(sqlClientPool).selectGroupsByOrganizationId(models, oid)

  return orgGroups;
};

// list all users in all groups within an organization
export const getUsersByOrganizationId: ResolverFn = async (
  _,
  args,
  { hasPermission, models, sqlClientPool }
) => {
  await hasPermission('organization', 'viewUsers', {
    organization: args.organization,
  });

  const orgGroups = await groupHelpers(sqlClientPool).selectGroupsByOrganizationId(models, args.organization)

  let members = []
  for (const group in orgGroups) {
    const groupMembers = await models.GroupModel.getGroupMembership(orgGroups[group]);
    // there is probably a better way to do this to only add unique members in the organization in the response
    let exists = false;
    for (const member in groupMembers) {
      for (const m in members) {
        if (groupMembers[member].user.id == members[m].id) {
          exists = true
        }
      }
      if (!exists) {
        // quick check to set the owner flag or not
        groupMembers[member].user.owner = false
        groupMembers[member].user.comment = null
        if (groupMembers[member].user.attributes["comment"]) {
          groupMembers[member].user.comment = groupMembers[member].user.attributes["comment"][0]
        }
        if (groupMembers[member].user.attributes["lagoon-organizations"]) {
          for (const a in groupMembers[member].user.attributes["lagoon-organizations"]) {
            if (parseInt(groupMembers[member].user.attributes["lagoon-organizations"][a]) == args.organization) {
              groupMembers[member].user.owner = true
            }
          }
        }
        members.push(groupMembers[member].user)
      }
      exists = false
    }
  }
  return members.map(row => ({ ...row, organization: args.organization }));
};

// get a users information for a user in the organization
export const getUserByEmailAndOrganizationId: ResolverFn = async (
  _root,
  { email, organization},
  { sqlClientPool, models, hasPermission },
) => {
  await hasPermission('organization', 'viewUser', {
    organization: organization
  });

  try {
    const user = await models.UserModel.loadUserByUsername(email);
    const queryUserGroups = await models.UserModel.getAllGroupsForUser(user.id, organization);

    user.owner = false
    user.comment = null
    if (user.attributes["comment"]) {
      user.comment = user.attributes["comment"][0]
    }
    if (user.attributes["lagoon-organizations"]) {
      for (const a in user.attributes["lagoon-organizations"]) {
        if (parseInt(user.attributes["lagoon-organizations"][a]) == organization) {
          user.owner = true
        }
      }
    }
    if (queryUserGroups.length == 0) {
      // if this user has no groups in this organization, then return nothing about this user at all
      return null
    }
    return { ...user, organization: organization };
  } catch (err) {
    return null
  }
  return null
};

// list the group roles for this user that have the organization id
export const getGroupRolesByUserIdAndOrganization: ResolverFn =async (
  { id: uid, organization },
  _input,
  { hasPermission, models, adminScopes }
) => {
  if (organization) {
    const queryUserGroups = await models.UserModel.getAllGroupsForUser(uid, organization);
    let groups = []
    for (const g in queryUserGroups) {
      let group = {id: queryUserGroups[g].id, name: queryUserGroups[g].name, role: queryUserGroups[g].subGroups[0].realmRoles[0], groupType: null, organization: null}
      if (queryUserGroups[g].attributes["type"]) {
        group.groupType = queryUserGroups[g].attributes["type"][0]
      }
      if (queryUserGroups[g].attributes["lagoon-organization"]) {
        group.organization = queryUserGroups[g].attributes["lagoon-organization"][0]
      }
      groups.push(group)
    }

    return groups;
  }
  return null
}

// list all groups by organization id
export const getGroupsByNameAndOrganizationId: ResolverFn = async (
  root,
  { name, organization },
  { hasPermission, models, keycloakGrant }
) => {
  try {
    await hasPermission('organization', 'viewGroup', {
      organization: organization,
    });

    const group = await models.GroupModel.loadGroupByName(name);
    if (R.prop('lagoon-organization', group.attributes)) {
      if (R.prop('lagoon-organization', group.attributes).toString() == organization) {
        return group
      }
    }
  } catch (err) {
      return [];
  }
  return [];
};

export const getGroupCountByOrganizationProject: ResolverFn = async (
  { id: pid },
  _input,
  { sqlClientPool, models }
) => {
  const orgProjectGroups = await groupHelpers(sqlClientPool).selectGroupsByProjectId(models, pid)
  return orgProjectGroups.length
}

// get the groups of a project in an organization
// this is only accessible as a resolver of organizations
// skip permissions checks as they are already
// performed in the main resolver function for organizations
export const getGroupsByOrganizationsProject: ResolverFn = async (
  { id: pid },
  _input,
  { sqlClientPool, models, keycloakGrant, keycloakUsersGroups, adminScopes }
) => {
  const orgProjectGroups = await groupHelpers(sqlClientPool).selectGroupsByProjectId(models, pid)
  if (adminScopes.projectViewAll) {
    // if platform owner, this will show ALL groups on a project (those that aren't in the organization too, yes its possible with outside intervention :| )
    return orgProjectGroups;
  }

  const user = await models.UserModel.loadUserById(
    keycloakGrant.access_token.content.sub
  );
  // if this user is an owner of an organization, then also display org based groups to this user
  // when listing project groups
  const userGroups = keycloakUsersGroups;
  const usersOrgs = R.defaultTo('', R.prop('lagoon-organizations',  user.attributes)).toString()
  const usersOrgsViewer = R.defaultTo('', R.prop('lagoon-organizations-viewer',  user.attributes)).toString()

  if (usersOrgs != "" ) {
    const usersOrgsArr = usersOrgs.split(',');
    for (const userOrg of usersOrgsArr) {
      const project = await projectHelpers(sqlClientPool).getProjectById(pid);
      if (project.organization == userOrg) {
        const orgGroups = await groupHelpers(sqlClientPool).selectGroupsByOrganizationId(models, project.organization)
        for (const pGroup of orgGroups) {
          userGroups.push(pGroup)
        }
      }
    }
  }
  if (usersOrgsViewer != "" ) {
    const usersOrgsArr = usersOrgsViewer.split(',');
    for (const userOrg of usersOrgsArr) {
      const project = await projectHelpers(sqlClientPool).getProjectById(pid);
      if (project.organization == userOrg) {
        const orgGroups = await groupHelpers(sqlClientPool).selectGroupsByOrganizationId(models, project.organization)
        for (const pGroup of orgGroups) {
          userGroups.push(pGroup)
        }
      }
    }
  }
  const userProjectGroups = R.intersection(orgProjectGroups, userGroups);

  return userProjectGroups;
};

// check an existing project and the associated groups can be added to an organization
// this will return errors if there are projects or groups that are part of different organizations
// this is a helper function that is a WIP, not fully flushed out

const checkProjectGroupAssociation = async (oid, projectGroups, projectGroupNames, otherOrgs, groupProjectIds,projectInOtherOrgs, sqlClientPool) => {
    // get all the groups the requested project is in
    for (const group of projectGroups) {
      // for each group the project is in, check if it has an organization
      if (R.prop('lagoon-organization', group.attributes)) {
        // if it has an organization that is not the requested organization, add it to a list
        if (R.prop('lagoon-organization', group.attributes) != oid) {
          projectGroupNames.push({group: group.name, organization: R.prop('lagoon-organization', group.attributes).toString()})
          otherOrgs.push(R.prop('lagoon-organization', group.attributes).toString())
        }
      }
      // for each group the project is in, get the list of projects that are also in this group
      if (R.prop('lagoon-projects', group.attributes)) {
        const groupProjects = R.prop('lagoon-projects', group.attributes).toString().split(',')
        for (const project of groupProjects) {
          groupProjectIds.push({group: group.name, project: project})
        }
      }
    }

    if (groupProjectIds.length > 0) {
      // for all the groups->projects associations
      for (const pGroup of groupProjectIds) {
        const project = await projectHelpers(sqlClientPool).getProjectById(pGroup.project)
        // check if the projects are in an organization, and if so, add it to a list if it is in one not in the requested organization
        if (project.organization != oid && project.organization != null) {
          projectInOtherOrgs.push({group: pGroup.group, project: project.name, organization: project.organization})
          otherOrgs.push(project.organization.toString())
        }
      }
    }

    // report errors here
    const uniqOtherOrgs = new Set(otherOrgs)
    if (projectInOtherOrgs.length > 0) {
      if (uniqOtherOrgs.size > 1) {
        throw new Error(`This project has groups that have projects in other organizations: [${JSON.stringify(projectInOtherOrgs)}]`)
      } else {
        // if there is only 1 organization across all the associated projects/groups, then its possible to modify all of these to change them
        // to the new organization
        // throw new Error(`This project has groups that have projects in 1 other organizations: [${[...uniqOtherOrgs]}]`)
      }
    }
    if (projectGroupNames.length > 0) {
      if (uniqOtherOrgs.size > 1) {
        throw new Error(`This project has groups that are in other organizations: [${JSON.stringify(projectGroupNames)}]`)
      } else {
        // if there is only 1 organization across all the associated projects/groups, then its possible to modify all of these to change them
        // to the new organization
        // throw new Error(`This project has groups that are in 1 other organizations: [${[...uniqOtherOrgs]}]`)
      }
    }
}

export const getProjectGroupOrganizationAssociation: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, models, hasPermission }
) => {
  let pid = input.project;
  let oid = input.organization;

  // platform admin only as it potentially reveals information about projects/orgs/groups
  await hasPermission('organization', 'add');

  const groupProjectIds = []
  const projectInOtherOrgs = []
  const projectGroupNames = []
  const otherOrgs = []

  // get all the groups the requested project is in
  const projectGroups = await groupHelpers(sqlClientPool).selectGroupsByProjectId(models, pid)
  await checkProjectGroupAssociation(oid, projectGroups, projectGroupNames, otherOrgs, groupProjectIds, projectInOtherOrgs, sqlClientPool)

  return "success";
};

// remove project from an organization
// this removes all notifications and groups from the project and resets all the access to the project to only
// the default project group and the default-user of the project
export const removeProjectFromOrganization: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, models, userActivityLogger }
) => {
  // platform admin only
  await hasPermission('organization', 'add');

  let pid = input.project;
  const project = await projectHelpers(sqlClientPool).getProjectById(pid)
  if (project.organization != input.organization) {
    throw new Error(
      `Project is not in organization`
    );
  }

  try {
    const projectGroups = await groupHelpers(sqlClientPool).selectGroupsByProjectId(models, pid)

    let removeGroups = []
    for (const g in projectGroups) {
      if (projectGroups[g].attributes["type"] == "project-default-group") {
        // remove all users from the project default group except the `default-user@project`
        await models.GroupModel.removeNonProjectDefaultUsersFromGroup(projectGroups[g], project.name)
        // update group
        await models.GroupModel.updateGroup({
          id: projectGroups[g].id,
          name: projectGroups[g].name,
          attributes: {
            ...projectGroups[g].attributes,
            "lagoon-organization": [""]
          }
        });
      } else {
        removeGroups.push(projectGroups[g])
      }
    }
    // remove groups from project
    await models.GroupModel.removeProjectFromGroups(pid, removeGroups);
  } catch (err) {
    throw new Error(
      `Unable to remove all groups from the project`
    )
  }
  try {
    // remove all notifications from project
    await notificationHelpers(sqlClientPool).removeAllNotificationsFromProject({project: pid})
  } catch (err) {
    throw new Error(
      `Unable to remove all notifications from the project`
    )
  }

  try {
    // remove the project from the organization
    await query(
      sqlClientPool,
      Sql.updateProjectOrganization({
        pid,
        patch:{
          organization: null,
        }
      })
    );
  } catch (err) {
    throw new Error(
      `Unable to remove project from organization`
    )
  }

  const org = await query(sqlClientPool, Sql.selectOrganization(input.organization));
  userActivityLogger(`User removed project ${project.name} from an organization ${R.prop(0, org).name}`, {
    project: '',
    organization: input.organization,
    event: 'api:removeProjectFromOrganization',
    payload: {
      data: {
        input
      }
    }
  });

  return projectHelpers(sqlClientPool).getProjectById(pid);
}

// add existing project to an organization
export const addExistingProjectToOrganization: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger, models }
) => {

  let pid = input.project;
  let oid = input.organization;

  // platform admin only as it potentially reveals information about projects/orgs/groups
  await hasPermission('organization', 'add');

  const groupProjectIds = []
  const projectInOtherOrgs = []
  const projectGroupNames = []
  const otherOrgs = []

  // get all the groups the requested project is in
  const projectGroups = await groupHelpers(sqlClientPool).selectGroupsByProjectId(models, pid)
  await checkProjectGroupAssociation(oid, projectGroups, projectGroupNames, otherOrgs, groupProjectIds, projectInOtherOrgs, sqlClientPool)

  // check if project.organization is already set?
  // get all groups the project is in
  for (const group of projectGroups) {
    // update the groups to be in the organization
    const updatedGroup = await models.GroupModel.updateGroup({
      id: group.id,
      name: group.name,
      attributes: {
        ...group.attributes,
        "lagoon-organization": [input.organization]
      }
    });

    // log this activity
    userActivityLogger(`User added a group to organization`, {
      project: '',
      organization: input.organization,
      event: 'api:updateOrganizationGroup',
      payload: {
        data: {
          updatedGroup
        }
      }
    });
  }

  //  check all the groups for associations
  //  update all groups to be in the organization
  // set project.organization
  await query(
    sqlClientPool,
    Sql.updateProjectOrganization({
      pid,
      patch:{
        organization: oid,
      }
    })
  );

  // log this activity
  userActivityLogger(`User added a project to organization`, {
    project: '',
    organization: input.organization,
    event: 'api:addExistingProjectToOrganization',
    payload: {
      data: {
        project: pid,
        patch:{
          organization: oid,
        }
      }
    }
  });

  return projectHelpers(sqlClientPool).getProjectById(pid);
}

const checkOrgProjectGroup = async (sqlClientPool, input, models) => {
  // check the organization exists
  const organizationData = await Helpers(sqlClientPool).getOrganizationById(input.organization);
  if (organizationData === undefined) {
    throw new Error(`Organization does not exist`)
  }

  // check the requested group exists
  const group = await models.GroupModel.loadGroupByIdOrName(input);
  if (group === undefined) {
    throw new Error(`Group does not exist`)
  }

  // check the organization for projects currently attached to it
  const projectsByOrg = await projectHelpers(sqlClientPool).getProjectByOrganizationId(input.organization);
  const projectIdsByOrg = []
  for (const project of projectsByOrg) {
    projectIdsByOrg.push(parseInt(project.id))
  }

  // get the project ids
  const groupProjectIds = []
  if (R.prop('lagoon-projects', group.attributes)) {
    const groupProjects = R.prop('lagoon-projects', group.attributes).toString().split(',')
    if (groupProjects.length > 0) {
      for (const project of groupProjects) {
        groupProjectIds.push(parseInt(project))
      }
    }
  }

  if (projectIdsByOrg.length > 0 && groupProjectIds.length > 0) {
    if (projectIdsByOrg.length == 0) {
      let filters = arrayDiff(groupProjectIds, projectIdsByOrg)
      throw new Error(`This organization has no projects associated to it, the following projects that are not part of the requested organization: [${filters}]`)
    } else {
      if (groupProjectIds.length > 0) {
        let filters = arrayDiff(groupProjectIds, projectIdsByOrg)
        if (filters.length > 0) {
          throw new Error(`This group has the following projects that are not part of the requested organization: [${filters}]`)
        }
      }
    }
  }

  return group
}

// check an existing group to see if it can be added to an organization
// this function will return errors if there are projects in the group that are not in the organization
// if there are no projects in the organization, and no projects in the group then it will succeed
// this is a helper function that is a WIP, not fully flushed out
export const getGroupProjectOrganizationAssociation: ResolverFn = async (
  _root,
  { input },
  { models, sqlClientPool, hasPermission }
) => {
  // platform admin only as it potentially reveals information about projects/orgs/groups
  await hasPermission('organization', 'add');

  await checkOrgProjectGroup(sqlClientPool, input, models)

  return "success"
};

// add an existing group to an organization
// this function will return errors if there are projects in the group that are not in the organization
// if there are no projects in the organization, and no projects in the group then it will succeed
export const addExistingGroupToOrganization: ResolverFn = async (
  _root,
  { input },
  { models, sqlClientPool, hasPermission, userActivityLogger }
) => {
  // platform admin only as it potentially reveals information about projects/orgs/groups
  await hasPermission('organization', 'add');

  // check the organization exists
  const organizationData = await Helpers(sqlClientPool).getOrganizationById(input.organization);
  if (organizationData === undefined) {
    throw new Error(`Organization does not exist`)
  }

  const group = await checkOrgProjectGroup(sqlClientPool, input, models)

  // update the group to be in the organization
  const updatedGroup = await models.GroupModel.updateGroup({
    id: group.id,
    name: group.name,
    attributes: {
      ...group.attributes,
      "lagoon-organization": [input.organization]
    }
  });

  // log this activity
  userActivityLogger(`User added a group to organization`, {
    project: '',
    organization: input.organization,
    event: 'api:updateOrganizationGroup',
    payload: {
      data: {
        updatedGroup
      }
    }
  });

  return updatedGroup
};

// removes a user from all groups in an organisation
export const removeUserFromOrganizationGroups: ResolverFn = async (
  _root,
  { input: { user: userInput, organization: organizationInput } },
  { models, sqlClientPool, hasPermission, userActivityLogger }
) => {

  if (R.isEmpty(userInput)) {
    throw new Error('You must provide a user id or email');
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput)
  });

  // check the organization exists
  const organizationData = await Helpers(sqlClientPool).getOrganizationById(organizationInput);
  if (organizationData === undefined) {
    throw new Error(`Organization does not exist`)
  }

  // check permissions and get groups
  await hasPermission('organization', 'removeGroup', {
    organization: organizationInput,
  });
  const orgGroups = await groupHelpers(sqlClientPool).selectGroupsByOrganizationId(models, organizationInput)

  // iterate through groups and remove the user
  let groupsRemoved = []
  for (const group in orgGroups) {
    // if the groups organization is the one to remove from, push it to a new array
    if (R.prop('lagoon-organization',  orgGroups[group].attributes) == organizationInput) {
      groupsRemoved.push(orgGroups[group]);
    }
  }

  try {
    await models.GroupModel.removeUserFromGroups(user, groupsRemoved);
  } catch (error) {
    throw new Error(`Unable to remove user from groups: ${error}`)
  }

  userActivityLogger(`User removed from these groups in organization: ${organizationData.name}`, {
    project: '',
    organization: organizationData.name,
    event: 'api:removeUserFromOrganizationGroups',
    payload: {
      input: {
        user: userInput, organization: organizationInput
      },
      data: groupsRemoved
    }
  });

  return organizationData;
};

// delete an organization, only if it has no projects, notifications, or groups
export const deleteOrganization: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, hasPermission, userActivityLogger, models }
) => {
  await hasPermission('organization', 'delete', {
    organization: input.id
  });

  const rows = await query(sqlClientPool, Sql.selectOrganization(input.id));
  if (R.length(rows) == 0) {
    throw new Error(
      `Organization doesn't exist`
    );
  }
  const orgResult = rows[0];

  const projects = await query(
    sqlClientPool, Sql.selectOrganizationProjects(orgResult.id)
  );

  if (projects.length > 0) {
    // throw error if there are any existing environments
    throw new Error(
      'Unable to delete organization, there are existing projects that need to be removed first'
    );
  }

  const notifications = await Helpers(sqlClientPool).getNotificationsForOrganizationId(orgResult.id)
  if (notifications.length > 0) {
    // throw error if there are any existing environments
    throw new Error(
      'Unable to delete organization, there are existing notifications that need to be removed first'
    );
  }

  const orgGroups = await groupHelpers(sqlClientPool).selectGroupsByOrganizationId(models, orgResult.id)
  if (orgGroups.length > 0) {
    // throw error if there are any existing environments
    throw new Error(
      'Unable to delete organization, there are existing groups that need to be removed first'
    );
  }

  try {
    await query(
      sqlClientPool,
      Sql.deleteOrganizationDeployTargets(orgResult.id)
    );

    await query(
      sqlClientPool,
      Sql.deleteOrganization(orgResult.id)
    );
  } catch (err) {
    throw new Error(
      `Unable to delete organization`
    )
  }

  userActivityLogger(`User deleted an organization '${orgResult.name}'`, {
    project: '',
    event: 'api:deleteOrganization',
    payload: {
      input: {
        orgResult
      }
    }
  });
  return 'success';
};

const checkBulkProjectGroupAssociation = async (oid, pid, projectsToMove, groupsToMove, projectsInOtherOrgs, groupsInOtherOrgs, sqlClientPool, models, keycloakGroups) => {
  const groupProjectIds = [];
  const projectGroups = await models.GroupModel.loadGroupsByProjectIdFromGroups(pid, keycloakGroups);
  // get all the groups the requested project is in
  for (const group of projectGroups) {
    // for each group the project is in, get the list of projects that are also in this group
    if (R.prop('lagoon-projects', group.attributes)) {
      const groupProjects = R.prop('lagoon-projects', group.attributes).toString().split(',')
      for (const project of groupProjects) {
        groupProjectIds.push({group: group.name, project: project})
      }
    }
  }

  // for all the projects in the first projects group, iterate through the projects and the groups attached
  // to these projects and try to build out a map of all the groups and projects that are linked by the primary project
  if (groupProjectIds.length > 0) {
    for (const pGroup of groupProjectIds) {
      const project = await projectHelpers(sqlClientPool).getProjectById(pGroup.project)
      const projectGroups = await models.GroupModel.loadGroupsByProjectIdFromGroups(project.id, keycloakGroups);
      // check if the project is already in the requested organization
      if (project.organization != oid && project.organization == null) {
        let alreadyAdded = false
        for (const f of projectsToMove) {
          if (f.id == project.id) {
            alreadyAdded = true
          }
        }
        if (!alreadyAdded) {
          // if it isn't already in the requested organization, add it to the list of projects that should be moved
          projectsToMove.push(project)
        }
      } else {
        // if the project is in a completely different organization
        if (project.organization != oid) {
          let alreadyAdded = false
          for (const f of projectsInOtherOrgs) {
            if (f.id == project.id) {
              alreadyAdded = true
            }
          }
          if (!alreadyAdded) {
            // add it to the lsit of projects that will cause this check to fail
            projectsInOtherOrgs.push(project)
          }
        }
      }
      for (const group of projectGroups) {
        // for every group that the project is in, check if the group is already in the requested organization
        if (group.organization != oid && group.organization == null) {
          let alreadyAdded = false
          for (const f of groupsToMove) {
            if (f.id == group.id) {
              alreadyAdded = true
            }
          }
          if (!alreadyAdded) {
            // if it isn't already in the requested organization, add it to the list of groups that should be moved
            groupsToMove.push(group)
          }
        } else {
          // if the group is in a completely different organization
          if (group.organization != oid) {
            let alreadyAdded = false
            for (const f of groupsInOtherOrgs) {
              if (f.id == group.id) {
                alreadyAdded = true
              }
            }
            if (!alreadyAdded) {
              // add it to the lsit of projects that will cause this check to fail
              groupsInOtherOrgs.push(group)
            }
          }
        }
      }
    }
  }
}

export const checkBulkImportProjectsAndGroupsToOrganization: ResolverFn = async (
  _root,
  { input },
  { sqlClientPool, models, hasPermission, keycloakGroups }
) => {
  let pid = input.project;
  let oid = input.organization;

  // platform admin only as it potentially reveals information about projects/orgs/groups
  await hasPermission('organization', 'add');

  const projectsToMove = []
  const groupsToMove = []
  const projectsInOtherOrgs = []
  const groupsInOtherOrgs = []

  // get all the groups the requested project is in
  await checkBulkProjectGroupAssociation(oid, pid, projectsToMove, groupsToMove, projectsInOtherOrgs, groupsInOtherOrgs, sqlClientPool, models, keycloakGroups)

  return { projects: projectsToMove, groups: groupsToMove, otherOrgProjects: projectsInOtherOrgs, otherOrgGroups: groupsInOtherOrgs };
};

// given a project, collect all the groups that this project has, and all the projects that those groups have and their associated projects
// and import them into the given organization
export const bulkImportProjectsAndGroupsToOrganization: ResolverFn = async (
  root,
  { input, detachNotifications },
  { sqlClientPool, hasPermission, userActivityLogger, models, keycloakGroups }
) => {

  let pid = input.project;
  let oid = input.organization;

  // platform admin only as it potentially reveals information about projects/orgs/groups
  await hasPermission('organization', 'add');

  const projectsToMove = []
  const groupsToMove = []
  const projectsInOtherOrgs = []
  const groupsInOtherOrgs = []

  // get all the groups the requested project is in
  await checkBulkProjectGroupAssociation(oid, pid,  projectsToMove, groupsToMove, projectsInOtherOrgs, groupsInOtherOrgs, sqlClientPool, models, keycloakGroups)

  // if anything comes back in projectsInOtherOrgs or groupsInOtherOrgs, then this mutation should fail and inform the user
  // to run the query first and return the fields that contain information about why it can't move the projects
  if (projectsInOtherOrgs.length > 0 || groupsInOtherOrgs.length > 0) {
    throw new Error(
      `The process detected projects or groups that are in another organization already, you should run checkBulkImportProjectsAndGroupsToOrganization and return otherOrgProjects and otherOrgGroups fields`
    )
  }

  // update all projects to be in the organization
  const groupsDone = [];
  const projectsDone = [];
  for (const group of groupsToMove) {
    // update the groups of the project to be in the organization
    if (!groupsDone.includes(group.id)) {
      if (group.organization != oid && group.organization == null) {
        await models.GroupModel.updateGroup({
          id: group.id,
          name: group.name,
          attributes: {
            ...group.attributes,
            "lagoon-organization": [input.organization]
          }
        });
        groupsDone.push(group.id)

        // log this activity
        userActivityLogger(`User added a group to organization`, {
          project: '',
          organization: input.organization,
          event: 'api:addGroupToOrganization',
          payload: {
            data: {
              group: group.name,
              organization: oid
            }
          }
        });
      }
    }
  }
  for (const project of projectsToMove) {
    if (!projectsDone.includes(project.id)) {
      if (project.organization != oid && project.organization == null) {
        if (detachNotifications) {
          // remove all notifications from projects before adding them to the organizations
          try {
            await notificationHelpers(sqlClientPool).removeAllNotificationsFromProject({project: project.id})
            userActivityLogger(`User removed all notifications from project`, {
              project: '',
              organization: input.organization,
              event: 'api:removeNotificationsFromProject',
              payload: {
                data: {
                  project: project.id,
                  patch:{
                    organization: oid,
                  }
                }
              }
            });
          } catch (err) {
            throw new Error(
              `Unable to remove all notifications from the project`
            )
          }
        }

        // set project.organization
        await query(
          sqlClientPool,
          Sql.updateProjectOrganization({
            pid: project.id,
            patch:{
              organization: oid,
            }
          })
        );
        projectsDone.push(project.id)

        // log this activity
        userActivityLogger(`User added a project to organization`, {
          project: '',
          organization: input.organization,
          event: 'api:addExistingProjectToOrganization',
          payload: {
            data: {
              project: project.id,
              patch:{
                organization: oid,
              }
            }
          }
        });
      }
    }
  }

  return { projects: projectsToMove, groups: groupsToMove, otherOrgProjects: projectsInOtherOrgs, otherOrgGroups: groupsInOtherOrgs };
}