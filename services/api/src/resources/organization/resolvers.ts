// @ts-ignore
import * as R from 'ramda';
import { ResolverFn } from '../';
import { logger } from '../../loggers/logger';
import { query, isPatchEmpty, knex } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';
import { Helpers} from './helpers';
import { Sql } from './sql';
import { arrayDiff } from '../../util/func';

export const addOrganization: ResolverFn = async (
  args,
  { input },
  { sqlClientPool, hasPermission }
) => {
    try {
        await hasPermission('organization', 'add');
        const { insertId } = await query(sqlClientPool, Sql.insertOrganization(input));
        const rows = await query(sqlClientPool, Sql.selectOrganization(insertId));
        return R.prop(0, rows);
    }  catch (err) {
        throw new Error(`There was an error creating the organization ${input.name}`);
    }
};


export const addDeployTargetToOrganization: ResolverFn = async (
  args,
  { input },
  { sqlClientPool, hasPermission }
) => {
    try {
        await hasPermission('organization', 'add');
        const { insertId } = await query(sqlClientPool, Sql.addDeployTarget({dtid: input.deployTarget, orgid: input.organization}));
        return insertId
    }  catch (err) {
        throw new Error(`There was an error adding the deployTarget: ${err}`);
    }
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

  const rows = await query(
      sqlClientPool,
      `SELECT dt.*
      FROM openshift as dt
      JOIN organization_deploy_target as odt ON dt.id=odt.dtid
      WHERE orgid = :organization`,
      { organization: oid }
  );
  const orgResult = rows;

  if (!orgResult) {
      return null;
  }

  return orgResult;
};

export const updateOrganization: ResolverFn = async (
    root,
    { input },
    { sqlClientPool, hasPermission }
) => {
    await hasPermission('organization', 'update');

    const oid = input.id.toString();

    if (isPatchEmpty(input)) {
      throw new Error('input.patch requires at least 1 attribute');
    }

    await query(sqlClientPool, Sql.updateOrganization(input));
    const rows = await query(sqlClientPool, Sql.selectOrganization(oid));

    return R.prop(0, rows);
};

export const getOrganizationById: ResolverFn = async (
    organization,
    args,
    { sqlClientPool, hasPermission }
) => {
    let oid = args.organization;
    if (organization) {
      oid = organization;
    }

    await hasPermission('organization', 'view', {
        organization: oid,
    });

    const rows = await query(
        sqlClientPool,
        `SELECT *
        FROM organization
        WHERE id = :organization`,
        { organization: oid }
    );
    const orgResult = rows[0];

    if (!orgResult) {
        return null;
    }

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

  let input = {oid: oid, pid: pid, type: "slack"}
  // get all the notifications for the projects
  const slacks = await query(
    sqlClientPool,
    Sql.selectNotificationsByTypeByProjectId(input)
  );
  input.type = "rocketchat"
  const rcs = await query(
    sqlClientPool,
    Sql.selectNotificationsByTypeByProjectId(input)
  );
  input.type = "microsoftteams"
  const teams = await query(
    sqlClientPool,
    Sql.selectNotificationsByTypeByProjectId(input)
  );
  input.type = "email"
  const email = await query(
    sqlClientPool,
    Sql.selectNotificationsByTypeByProjectId(input)
  );
  input.type = "webhook"
  const webhook = await query(
    sqlClientPool,
    Sql.selectNotificationsByTypeByProjectId(input)
  );

  let result = [...slacks, ...rcs, ...teams, ...email, ...webhook]

  return result;
};

// gets owners of an organization by id
export const getOwnersByOrganizationId: ResolverFn = async (
  { id: oid },
  _input,
  { hasPermission, models, keycloakGrant, keycloakUsersGroups }
) => {
  const orgUsers = await models.UserModel.loadUsersByOrganizationId(oid);

  try {
    await hasPermission('organization', 'view', {
      organization: oid,
    });

    return orgUsers;
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getOwnersByOrganizationId');
      return [];
    }

    const user = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub
    );
    const userGroups = keycloakUsersGroups;
    const orgOwners = R.intersection(orgUsers, userGroups);

    return orgOwners;
  }
};

// list all groups by organization id
export const getGroupsByOrganizationId: ResolverFn = async (
  { id: oid },
  _input,
  { hasPermission, models, keycloakGrant }
) => {
  const orgGroups = await models.GroupModel.loadGroupsByOrganizationId(oid);

  await hasPermission('organization', 'viewGroup', {
    organization: oid,
  });

  return orgGroups;
};

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

// get the groups of a project in an organization
// this is only accessible as a resolver of organizations
// skip permissions checks as they are already
// performed in the main resolver function for organizations
export const getGroupsByOrganizationsProject: ResolverFn = async (
  { id: pid },
  _input,
  { hasPermission, sqlClientPool, models, keycloakGrant, keycloakUsersGroups }
) => {
  const orgProjectGroups = await models.GroupModel.loadGroupsByProjectId(pid);
  if (!keycloakGrant) {
    logger.warn('No grant available for getGroupsByOrganizationsProject');
    return [];
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
        const orgGroups = await models.GroupModel.loadGroupsByOrganizationId(project.organization);
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
        const orgViewerGroups = await models.GroupModel.loadGroupsByOrganizationId(project.organization);
        for (const pGroup of orgViewerGroups) {
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
  const projectGroups = await models.GroupModel.loadGroupsByProjectId(pid);
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

  return "success";
};

// add existing project to an organization
export const addProjectToOrganization: ResolverFn = async (
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
  const projectGroups = await models.GroupModel.loadGroupsByProjectId(pid);
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
    event: 'api:addProjectToOrganization',
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
// check an existing group to see if it can be added to an organization
// this function will return errors if there are projects in the group that are not in the organization
// if there are no projects in the organization, and no projects in the group then it will succeed
// this is a helper function that is a WIP, not fully flushed out
export const getGroupProjectOrganizationAssociation: ResolverFn = async (
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

  // check the requested group exists
  const group = await models.GroupModel.loadGroupByIdOrName(input);
  if (group === undefined) {
    throw new Error(`Group does not exist`)
  }

  // check the organization for projects currently attached to it
  const projectsByOrg = await projectHelpers(sqlClientPool).getProjectByOrganizationId(input.organization);
  const projectIdsByOrg = []
  for (const project of projectsByOrg) {
    projectIdsByOrg.push(project.id)
  }

  // get the project ids
  const groupProjectIds = []
  if (R.prop('lagoon-projects', group.attributes)) {
    const groupProjects = R.prop('lagoon-projects', group.attributes).toString().split(',')
    for (const project of groupProjects) {
      groupProjectIds.push(project)
    }
  }

  if (projectIdsByOrg.length > 0 && groupProjectIds.length > 0) {
    if (projectIdsByOrg.length == 0) {
      let filters = arrayDiff(groupProjectIds, projectIdsByOrg)
      //let filters2 = arrayDiff(projectIdsByOrg, groupProjectIds)
      throw new Error(`This organization has no projects associated to it, the following projects that are not part of the requested organization: [${filters}]`)
    } else {
      if (groupProjectIds.length > 0) {
        let filters = arrayDiff(groupProjectIds, projectIdsByOrg)
        //let filters2 = arrayDiff(projectIdsByOrg, groupProjectIds)
        if (filters.length > 0) {
          throw new Error(`This group has the following projects that are not part of the requested organization: [${filters}]`)
        }
      }
    }
  }

  return "success"

};

// add an existing group to an organization
// this function will return errors if there are projects in the group that are not in the organization
// if there are no projects in the organization, and no projects in the group then it will succeed
export const addGroupToOrganization: ResolverFn = async (
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

  // check the requested group exists
  const group = await models.GroupModel.loadGroupByIdOrName(input);
  if (group === undefined) {
    throw new Error(`Group does not exist`)
  }


  // check the organization for projects currently attached to it
  const projectsByOrg = await projectHelpers(sqlClientPool).getProjectByOrganizationId(input.organization);
  const projectIdsByOrg = []
  for (const project of projectsByOrg) {
    projectIdsByOrg.push(project.id)
  }

  // get the project ids
  const groupProjectIds = []
  if (R.prop('lagoon-projects', group.attributes)) {
    const groupProjects = R.prop('lagoon-projects', group.attributes).toString().split(',')
    for (const project of groupProjects) {
      groupProjectIds.push(project)
    }
  }

  if (projectIdsByOrg.length > 0 && groupProjectIds.length > 0) {
    if (projectIdsByOrg.length == 0) {
      let filters = arrayDiff(groupProjectIds, projectIdsByOrg)
      //let filters2 = arrayDiff(projectIdsByOrg, groupProjectIds)
      throw new Error(`This organization has no projects associated to it, the following projects that are not part of the requested organization: [${filters}]`)
    } else {
      if (groupProjectIds.length > 0) {
        let filters = arrayDiff(groupProjectIds, projectIdsByOrg)
        //let filters2 = arrayDiff(projectIdsByOrg, groupProjectIds)
        if (filters.length > 0) {
          throw new Error(`This group has the following projects that are not part of the requested organization: [${filters}]`)
        }
      }
    }
  }

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

  return "success"
};