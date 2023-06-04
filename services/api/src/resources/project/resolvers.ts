import * as R from 'ramda';
import validator from 'validator';
import sshpk from 'sshpk';
import { ResolverFn } from '../';
import { logger } from '../../loggers/logger';
import { knex, query, isPatchEmpty } from '../../util/db';
import { Helpers } from './helpers';
import { KeycloakOperations } from './keycloak';
import { OpendistroSecurityOperations } from '../group/opendistroSecurity';
import { Sql } from './sql';
import * as OS from '../openshift/sql';
import { generatePrivateKey, getSshKeyFingerprint } from '../sshKey';
import { Sql as sshKeySql } from '../sshKey/sql';
import { createHarborOperations } from './harborSetup';
import { getUserProjectIdsFromRoleProjectIds } from '../../util/auth';
import sql from '../user/sql';

const DISABLE_CORE_HARBOR = process.env.DISABLE_CORE_HARBOR || "false"

const isValidGitUrl = value =>
  /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/.test(
    value
  );

export const getPrivateKey: ResolverFn = async (
  project,
  _args,
  { hasPermission }
) => {
  try {
    await hasPermission('project', 'viewPrivateKey', {
      project: project.id
    });

    return project.privateKey;
  } catch (err) {
    return null;
  }
};

export const getAllProjects: ResolverFn = async (
  root,
  { order, createdAfter, gitUrl },
  { sqlClientPool, hasPermission, models, keycloakGrant, keycloakUsersGroups }
) => {
  let userProjectIds: number[];

  try {
    // admin check, if passed then pre-set authz
    await hasPermission('project', 'viewAll');
  } catch (err) {
    // else user
    if (!keycloakGrant) {
      logger.debug('No grant available for getAllProjects');
      return [];
    }
    // get the project ids from the users groups
    const userProjectRoles = await models.UserModel.getAllProjectsIdsForUser({
      id: keycloakGrant.access_token.content.sub,

    }, keycloakUsersGroups);
    userProjectIds = getUserProjectIdsFromRoleProjectIds(userProjectRoles);
  }

  let queryBuilder = knex('project');

  if (createdAfter) {
    queryBuilder = queryBuilder.andWhere('created', '>=', createdAfter);
  }

  if (gitUrl) {
    queryBuilder = queryBuilder.andWhere('git_url', gitUrl);
  }

  if (userProjectIds) {
    queryBuilder = queryBuilder.whereIn('id', userProjectIds);
  }

  if (order) {
    queryBuilder = queryBuilder.orderBy(order);
  }

  const rows = await query(sqlClientPool, queryBuilder.toString());
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  return withK8s;
};

export const getProjectByEnvironmentId: ResolverFn = async (
  { id: eid },
  args,
  { sqlClientPool, hasPermission }
) => {
  const rows = await query(
    sqlClientPool,
    `SELECT p.*
    FROM environment e
    JOIN project p ON e.project = p.id
    WHERE e.id = :eid
    LIMIT 1`,
    { eid }
  );
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  const project = withK8s[0];

  await hasPermission('project', 'view', {
    project: project.id
  });

  return project;
};

export const getProjectById: ResolverFn = async (
  { project: pid },
  args,
  { sqlClientPool, hasPermission }
) => {
  const rows = await query(
    sqlClientPool,
    `SELECT p.*
    FROM project p
    WHERE p.id = :pid
    LIMIT 1`,
    { pid }
  );
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  const project = withK8s[0];

  await hasPermission('project', 'view', {
    project: project.id
  });

  return project;
};

export const getProjectByGitUrl: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  const rows = await query(
    sqlClientPool,
    `SELECT *
    FROM project
    WHERE git_url = :git_url
    LIMIT 1`,
    args
  );
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  const project = withK8s[0];

  await hasPermission('project', 'view', {
    project: project.id
  });

  return project;
};

export const getProjectByName: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  const rows = await query(
    sqlClientPool,
    `SELECT *
    FROM project
    WHERE name = :name`,
    args
  );
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  const project = withK8s[0];

  if (!project) {
    return null;
  }

  await hasPermission('project', 'view', {
    project: project.id
  });

  return project;
};

export const getProjectsByMetadata: ResolverFn = async (
  root,
  { metadata },
  { sqlClientPool, hasPermission, keycloakGrant, models, keycloakUsersGroups },
  info
) => {
  let userProjectIds: number[];

  try {
    // admin check, if passed then pre-set authz
    await hasPermission('project', 'viewAll');
  } catch (err) {
    if (!keycloakGrant) {
      logger.debug('No grant available for getProjectsByMetadata');
      return [];
    }

    const userProjectRoles = await models.UserModel.getAllProjectsIdsForUser({
      id: keycloakGrant.access_token.content.sub
    }, keycloakUsersGroups);
    userProjectIds = getUserProjectIdsFromRoleProjectIds(userProjectRoles);
  }

  let queryBuilder = knex('project');

  if (userProjectIds) {
    queryBuilder = queryBuilder.whereIn('id', userProjectIds);
  }

  let queryArgs = [];
  for (const { key: meta_key, value: meta_value } of metadata) {
    if (meta_value) {
      queryBuilder = queryBuilder.whereRaw('JSON_CONTAINS(metadata, ?, ?)');
      queryArgs = [...queryArgs, `"${meta_value}"`, `$.${meta_key}`];
    }
    // Support key-only queries.
    else {
      queryBuilder = queryBuilder.whereRaw(
        "JSON_CONTAINS_PATH(metadata, 'one', ?)"
      );
      queryArgs = [...queryArgs, `$.${meta_key}`];
    }
  }

  const rows = await query(sqlClientPool, queryBuilder.toString(), queryArgs);
  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);

  return withK8s;
};

export const addProject = async (
  root,
  { input },
  { hasPermission, sqlClientPool, models, keycloakGrant, userActivityLogger, adminScopes }
) => {
  await hasPermission('project', 'add');

  if (validator.matches(input.name, /[^0-9a-z-]/)) {
    throw new Error(
      'Only lowercase characters, numbers and dashes allowed for name!'
    );
  }
  if (validator.matches(input.name, /--/)) {
    throw new Error('Multiple consecutive dashes are not allowed for name!');
  }
  if (!isValidGitUrl(input.gitUrl)) {
    throw new Error('The provided gitUrl is invalid.');
  }
  const openshift = input.kubernetes || input.openshift;
  if (!openshift) {
    throw new Error('Must provide kubernetes or openshift field');
  }

  // check if project already exists before doing anything else
  const pidResult = await query(
    sqlClientPool,
    Sql.selectProjectIdByName(input.name)
  );
  if (R.length(pidResult) >= 1) {
    throw new Error(
      `Error creating project '${input.name}'. Project already exists.`
    );
  }

  let keyPair: any = {};
  try {
    const privateKey = R.cond([
      [R.isNil, generatePrivateKey],
      [R.isEmpty, generatePrivateKey],
      [R.T, sshpk.parsePrivateKey]
    ])(R.prop('privateKey', input));

    const publicKey = privateKey.toPublic();

    keyPair = {
      ...keyPair,
      private: R.replace(/\n/g, '\n', privateKey.toString('openssh')),
      public: publicKey.toString()
    };
  } catch (err) {
    throw new Error(`There was an error with the privateKey: ${err.message}`);
  }

  const openshiftProjectPattern =
    input.kubernetesNamespacePattern || input.openshiftProjectPattern;

  // check if a user has permission to disable deployments of a project or not
  let deploymentsDisabled = 0;
  if (input.deploymentsDisabled) {
    if (adminScopes.projectViewAll) {
      deploymentsDisabled = input.deploymentsDisabled
    }
  }

  let buildImage = null;
  if (input.buildImage) {
    if (adminScopes.projectViewAll) {
      buildImage = input.buildImage
    } else {
      throw new Error('Setting build image is only available to administrators.');
    }
  }

  const osRows = await query(sqlClientPool, OS.Sql.selectOpenshift(openshift));
  if(osRows.length == 0) {
    throw Error(`Openshift ID: "${openshift}" does not exist"`);
  }

  const { insertId } = await query(
    sqlClientPool,
    Sql.createProject({
    ...input,
    openshift,
    openshiftProjectPattern,
    privateKey: keyPair.private
  }));

  const rows = await query(
    sqlClientPool, Sql.selectProject(insertId)
  );

  const withK8s = Helpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  const project = withK8s[0];

  // Create a default group for this project
  let group;
  try {
    group = await models.GroupModel.addGroup({
      name: `project-${project.name}`,
      attributes: {
        type: ['project-default-group'],
        'lagoon-projects': [project.id],
        'group-lagoon-project-ids': [`{${JSON.stringify(`project-${project.name}`)}:[${project.id}]}`]
      }
    });
  } catch (err) {
    logger.error(
      `Could not create default project group for ${project.name}: ${err.message}`
    );
  }

  OpendistroSecurityOperations(
    sqlClientPool,
    models.GroupModel
  ).syncGroupWithSpecificTenant(
    `p${project.id}`,
    'global_tenant',
    `${project.id}`
  );

  // Find or create a user that has the public key linked to them
  const userRows = await query(
    sqlClientPool,
    sshKeySql.selectUserIdsBySshKeyFingerprint(
      getSshKeyFingerprint(keyPair.public)
    )
  );
  const userId = R.path([0, 'usid'], userRows);

  let user;
  if (!userId) {
    try {
      user = await models.UserModel.addUser({
        email: `default-user@${project.name}`,
        username: `default-user@${project.name}`,
        comment: `autogenerated user for project ${project.name}`
      });

      const keyParts = keyPair.public.split(' ');

      const { insertId } = await query(
        sqlClientPool,
        sshKeySql.insertSshKey({
          id: null,
          name: 'auto-add via api',
          keyValue: keyParts[1],
          keyType: keyParts[0],
          keyFingerprint: getSshKeyFingerprint(keyPair.public)
        })
      );
      await query(
        sqlClientPool,
        sshKeySql.addSshKeyToUser({ sshKeyId: insertId, userId: user.id })
      );
    } catch (err) {
      logger.error(
        `Could not create default project user for ${project.name}: ${err.message}`
      );
    }
  } else {
    user = await models.UserModel.loadUserById(userId);
  }

  // Add the user (with linked public key) to the default group with maintainer role
  try {
    await models.GroupModel.addUserToGroup(user, group, 'maintainer');
  } catch (err) {
    logger.error(
      `Could not link user to default project group for ${project.name}: ${err.message}`
    );
  }

  // Add the user who submitted this request to the project
  let userAlreadyHasAccess = false;
  if (adminScopes.projectViewAll) {
    userAlreadyHasAccess = true
  }

  if (!userAlreadyHasAccess && keycloakGrant) {
    const user = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub
    );

    try {
      await models.GroupModel.addUserToGroup(user, group, 'owner');
    } catch (err) {
      logger.error(
        `Could not link requesting user to default project group for ${project.name}: ${err.message}`
      );
    }
  }

  if (DISABLE_CORE_HARBOR == "false") {
    const harborOperations = createHarborOperations(sqlClientPool);
    await harborOperations.addProject(project.name, project.id);
  }

  userActivityLogger(`User added a project '${project.name}'`, {
    project: '',
    event: 'api:addProject',
    payload: {
      input,
      data: project
    }
  });

  return project;
};

export const deleteProject: ResolverFn = async (
  _root,
  { input: { project: projectName } },
  { sqlClientPool, hasPermission, userActivityLogger, models, keycloakGroups }
) => {
  // Will throw on invalid conditions
  const pid = await Helpers(sqlClientPool).getProjectIdByName(projectName);
  const project = await Helpers(sqlClientPool).getProjectById(pid);

  await hasPermission('project', 'delete', {
    project: pid
  });

  // check for existing environments
  const rows = await query(
    sqlClientPool, Sql.selectEnvironmentsByProjectId(pid)
  );

  if (rows.length > 0) {
    // throw error if there are any existing environments
    throw new Error(
      'Unable to delete project, there are existing environments that need to be removed first'
    );
  }

  await Helpers(sqlClientPool).deleteProjectById(pid);

  // Remove the project from all groups it is associated to
  try {
    const projectGroups = await models.GroupModel.loadGroupsByProjectIdFromGroups(pid, keycloakGroups);
    for (const groupInput of projectGroups) {
      const group = await models.GroupModel.loadGroupByIdOrName(groupInput);
      await models.GroupModel.removeProjectFromGroup(project.id, group);
      const projectIdsArray = await models.GroupModel.getProjectsFromGroupAndSubgroups(
        group
      );
      const projectIds = R.join(',')(projectIdsArray);
      OpendistroSecurityOperations(sqlClientPool, models.GroupModel).syncGroup(
        group.name,
        projectIds
      );
    }
  } catch (err) {
    logger.error(
      `Could not remove project from associated groups ${project.name}: ${err.message}`
    );

  }

  // Remove the default project group
  try {
    const group = await models.GroupModel.loadGroupByName(
      `project-${project.name}`
    );
    await models.GroupModel.deleteGroup(group.id);
    OpendistroSecurityOperations(
      sqlClientPool,
      models.GroupModel
    ).deleteGroupWithSpecificTenant(`p${pid}`, group.name);
  } catch (err) {
    logger.error(
      `Could not delete default group for project ${project.name}: ${err.message}`
    );
  }

  // Remove the default user
  try {
    const user = await models.UserModel.loadUserByUsername(
      `default-user@${project.name}`
    );
    await models.UserModel.deleteUser(user.id);
  } catch (err) {
    logger.error(
      `Could not delete default user for project ${project.name}: ${err.message}`
    );
  }

  // @TODO discuss if we want to delete projects in harbor or not
  // if (DISABLE_CORE_HARBOR == "false") {
  //   const harborOperations = createHarborOperations(sqlClientPool);
  //   const harborResults = await harborOperations.deleteProject(project.name)
  // }

  userActivityLogger(`User deleted a project '${project.name}'`, {
    project: '',
    event: 'api:deleteProject',
    payload: {
      input: {
        project
      }
    }
  });

  return 'success';
};

export const updateProject: ResolverFn = async (
  root,
  {
    input: {
      id,
      patch,
      patch: {
        name,
        gitUrl,
        availability,
        privateKey,
        subfolder,
        routerPattern,
        activeSystemsDeploy,
        activeSystemsRemove,
        activeSystemsTask,
        activeSystemsMisc,
        activeSystemsPromote,
        branches,
        productionEnvironment,
        productionRoutes,
        productionAlias,
        standbyProductionEnvironment,
        standbyRoutes,
        standbyAlias,
        autoIdle,
        storageCalc,
        problemsUi,
        factsUi,
        productionBuildPriority,
        developmentBuildPriority,
        deploymentsDisabled,
        pullrequests,
        developmentEnvironmentsLimit,
        buildImage
      }
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, models, adminScopes }
) => {
  await hasPermission('project', 'update', {
    project: id
  });

  // check if a user has permission to disable deployments of a project or not
  if (deploymentsDisabled) {
    if (!adminScopes.projectViewAll) {
      throw new Error('Disabling deployments is only available to administrators.');
    }
  }

  // check if a user has permission to change the build image of a project or not
  if (buildImage) {
    if (!adminScopes.projectViewAll) {
      throw new Error('Setting build image is only available to administrators.');
    }
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  if (typeof name === 'string') {
    if (validator.matches(name, /[^0-9a-z-]/)) {
      throw new Error(
        'Only lowercase characters, numbers and dashes allowed for name!'
      );
    }
  }

  // if the name is provided in a patch, check that the user trying to rename the project is an admin.
  // renaming projects is prohibited because lagoon uses the project name for quite a few things
  // which if changed can have unintended consequences for any existing environments
  if (patch.name) {
    if (!adminScopes.projectViewAll) {
      throw new Error('Project renaming is only available to administrators.');
    }
  }

  if (gitUrl !== undefined && !isValidGitUrl(gitUrl)) {
    throw new Error('The provided gitUrl is invalid.');
  }

  const openshift = patch.kubernetes || patch.openshift;
  const openshiftProjectPattern =
    patch.kubernetesNamespacePattern || patch.openshiftProjectPattern;

  const oldProject = await Helpers(sqlClientPool).getProjectById(id);

  // If the privateKey is changed, automatically remove the old one from the
  // default user and link the new one.
  if (patch.privateKey) {
    let keyPair: any = {};
    try {
      const privateKey = sshpk.parsePrivateKey(R.prop('privateKey', patch))
      const publicKey = privateKey.toPublic();

      keyPair = {
        ...keyPair,
        private: R.replace(/\n/g, '\n', privateKey.toString('openssh')),
        public: publicKey.toString()
      };

      const keyParts = keyPair.public.split(' ');

      try {
        // since public keys can only be associated to a single user
        // if a polysite tries for some reason uses the same key across all the polysites
        // then only 1 of the default-users will be able to hold the public key
        // ideally each project should have its own key and polysite repos should
        // have the public key for each project added to it for pulls
        const { insertId } = await query(
          sqlClientPool,
          sshKeySql.insertSshKey({
            id: null,
            name: 'auto-add via api',
            keyValue: keyParts[1],
            keyType: keyParts[0],
            keyFingerprint: getSshKeyFingerprint(keyPair.public)
          })
        );
        const user = await models.UserModel.loadUserByUsername(
          `default-user@${oldProject.name}`
        );
        await query(
          sqlClientPool,
          sshKeySql.addSshKeyToUser({ sshKeyId: insertId, userId: user.id })
        );
      } catch (err) {
        logger.error(
          `Could not update default project user for ${oldProject.name}: ${err.message}`
        );
      }
    } catch (err) {
      throw new Error(`There was an error with the privateKey: ${err.message}`);
    }
  }

  // const originalProject = await Helpers(sqlClientPool).getProjectById(id);
  // const originalName = R.prop('name', originalProject);
  // const originalCustomer = parseInt(R.prop('customer', originalProject));

  // // If the project will be updating the `name` or `customer` fields, update Keycloak groups and users accordingly
  // if (typeof customer === 'number' && customer !== originalCustomer) {
  //   // Delete Keycloak users from original projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
  //   await Helpers(sqlClientPool).mapIfNoDirectProjectAccess(
  //     id,
  //     originalCustomer,
  //     async ({
  //       keycloakUserId,
  //       keycloakUsername,
  //       keycloakGroupId,
  //       keycloakGroupName,
  //     }) => {
  //       await keycloakAdminClient.users.delFromGroup({
  //         id: keycloakUserId,
  //         groupId: keycloakGroupId,
  //       });
  //       logger.debug(
  //         `Removed Keycloak user ${keycloakUsername} from group "${keycloakGroupName}"`,
  //       );
  //     },
  //   );
  // }

  await query(
    sqlClientPool,
    Sql.updateProject({
      id,
      patch: {
        name,
        gitUrl,
        availability,
        privateKey,
        subfolder,
        routerPattern,
        activeSystemsDeploy,
        activeSystemsRemove,
        activeSystemsTask,
        activeSystemsMisc,
        activeSystemsPromote,
        branches,
        productionEnvironment,
        productionRoutes,
        productionAlias,
        standbyProductionEnvironment,
        standbyRoutes,
        standbyAlias,
        autoIdle,
        storageCalc,
        problemsUi,
        factsUi,
        productionBuildPriority,
        developmentBuildPriority,
        deploymentsDisabled,
        pullrequests,
        openshift,
        openshiftProjectPattern,
        developmentEnvironmentsLimit,
        buildImage
      }
    })
  );

  // Rename the default group and user
  if (patch.name && oldProject.name !== patch.name) {
    try {
      const group = await models.GroupModel.loadGroupByName(
        `project-${oldProject.name}`
      );
      await models.GroupModel.updateGroup({
        id: group.id,
        name: `project-${patch.name}`
      });
    } catch (err) {
      logger.error(
        `Could not rename default group for project ${patch.name}: ${err.message}`
      );
    }

    try {
      const user = await models.UserModel.loadUserByUsername(
        `default-user@${oldProject.name}`
      );
      await models.UserModel.updateUser({
        id: user.id,
        email: `default-user@${patch.name}`,
        username: `default-user@${patch.name}`,
        comment: `autogenerated user for project ${patch.name}`
      });
    } catch (err) {
      logger.error(
        `Could not rename default user for project ${patch.name}: ${err.message}`
      );
    }
  }

  // if (typeof name === 'string' && name !== originalName) {
  //   const groupId = await KeycloakOperations.findGroupIdByName(originalName);

  //   await keycloakAdminClient.groups.update({ id: groupId }, { name });
  //   logger.debug(
  //     `Renamed Keycloak group ${groupId} from "${originalName}" to "${name}"`,
  //   );
  // }

  // if (typeof customer === 'number' && customer !== originalCustomer) {
  //   // Add Keycloak users to new projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
  //   await Helpers(sqlClientPool).mapIfNoDirectProjectAccess(
  //     id,
  //     customer,
  //     async ({
  //       keycloakUserId,
  //       keycloakUsername,
  //       keycloakGroupId,
  //       keycloakGroupName,
  //     }) => {
  //       await keycloakAdminClient.users.addToGroup({
  //         id: keycloakUserId,
  //         groupId: keycloakGroupId,
  //       });
  //       logger.debug(
  //         `Added Keycloak user ${keycloakUsername} to group "${keycloakGroupName}"`,
  //       );
  //     },
  //   );
  // }

  userActivityLogger(`User updated project '${oldProject.name}'`, {
    project: '',
    event: 'api:updateProject',
    payload: {
      project: oldProject.name,
      patch: {
        name,
        gitUrl,
        availability,
        privateKey,
        subfolder,
        routerPattern,
        activeSystemsDeploy,
        activeSystemsRemove,
        activeSystemsTask,
        activeSystemsMisc,
        activeSystemsPromote,
        branches,
        productionEnvironment,
        productionRoutes,
        productionAlias,
        standbyProductionEnvironment,
        standbyRoutes,
        standbyAlias,
        autoIdle,
        storageCalc,
        problemsUi,
        factsUi,
        productionBuildPriority,
        developmentBuildPriority,
        deploymentsDisabled,
        pullrequests,
        developmentEnvironmentsLimit,
        buildImage
      }
    }
  });

  return Helpers(sqlClientPool).getProjectById(id);
};

export const deleteAllProjects: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('project', 'deleteAll');

  const projectNames = await Helpers(sqlClientPool).getAllProjectNames();

  await query(sqlClientPool, Sql.truncateProject());

  for (const name of projectNames) {
    await KeycloakOperations.deleteGroup(name);
  }

  userActivityLogger(`User deleted all projects`, {
    project: '',
    event: 'api:deleteAllProjects',
    payload: {
      ...args
    }
  });

  // TODO: Check rows for success
  return 'success';
};

export const removeProjectMetadataByKey: ResolverFn = async (
  root,
  { input: { id, key } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('project', 'update', {
    project: id
  });

  if (!key) {
    throw new Error('key to remove is required');
  }

  if (typeof key === 'string') {
    if (validator.matches(key, /[^0-9a-z-]/)) {
      throw new Error(
        'Only lowercase characters, numbers and dashes allowed for key!'
      );
    }
  }

  await query(
    sqlClientPool,
    `UPDATE project
    SET metadata = JSON_REMOVE(metadata, :meta_key)
    WHERE id = :id`,
    { id, meta_key: `$.${key}` }
  );

  userActivityLogger(`User removed project metadata key '${key}'`, {
    project: '',
    event: 'api:removeProjectMetadataByKey',
    payload: {
      input: {
        id,
        key
      }
    }
  });

  return Helpers(sqlClientPool).getProjectById(id);
};

export const updateProjectMetadata: ResolverFn = async (
  root,
  {
    input: {
      id,
      patch,
      patch: { key, value }
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('project', 'update', {
    project: id
  });

  if (isPatchEmpty({ patch })) {
    throw new Error('input.patch expects both key and value attributes');
  }

  if (!key || !value) {
    throw new Error('input.patch expects both key and value attributes');
  }

  if (typeof key === 'string') {
    if (validator.matches(key, /[^0-9a-z-]/)) {
      throw new Error(
        'Only lowercase characters, numbers and dashes allowed for key!'
      );
    }
  }

  await query(
    sqlClientPool,
    `UPDATE project
    SET metadata = JSON_SET(metadata, :meta_key, :meta_value)
    WHERE id = :id`,
    {
      id,
      meta_key: `$.${key}`,
      meta_value: value
    }
  );

  userActivityLogger(`User updated project metadata`, {
    project: '',
    event: 'api:updateProjectMetadata',
    payload: {
      patch: {
        project: id,
        key,
        value
      }
    }
  });

  return Helpers(sqlClientPool).getProjectById(id);
};
