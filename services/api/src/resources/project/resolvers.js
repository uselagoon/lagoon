// @flow

const R = require('ramda');
const validator = require('validator');
const sshpk = require('sshpk');
const opendistroSecurityClient = require('../../clients/opendistroSecurityClient');
const logger = require('../../logger');
const {
  inClause,
  prepare,
  query,
  whereAnd,
  isPatchEmpty,
} = require('../../util/db');

const Helpers = require('./helpers');
const KeycloakOperations = require('./keycloak');
const { OpendistroSecurityOperations } = require('../group/opendistroSecurity');
const Sql = require('./sql');
const { generatePrivateKey, getSshKeyFingerprint } = require('../sshKey');
const sshKeySql = require('../sshKey/sql');
const harborClient = require('../../clients/harborClient');
const createHarborOperations = require('./harborSetup');

/* ::

import type {ResolversObj} from '../';

*/

const removePrivateKey = R.assoc('privateKey', null);

const isValidGitUrl = value =>
  /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/.test(value);

const getAllProjects = async (
  root,
  args,
  {
    sqlClient,
    hasPermission,
    models,
    keycloakGrant,
  },
) => {
  let where;
  try {
    await hasPermission('project', 'viewAll');

    where = whereAnd([
      args.createdAfter ? 'created >= :created_after' : '',
      args.gitUrl ? 'git_url = :git_url' : '',
    ]);
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getAllProjects');
      return [];
    }

    const userProjectIds = await models.UserModel.getAllProjectsIdsForUser({
      id: keycloakGrant.access_token.content.sub,
    });

    where = whereAnd([
      args.createdAfter ? 'created >= :created_after' : '',
      args.gitUrl ? 'git_url = :git_url' : '',
      inClause('id', userProjectIds),
    ]);
  }

  const order = args.order ? ` ORDER BY ${R.toLower(args.order)} ASC` : '';

  const prep = prepare(sqlClient, `SELECT * FROM project ${where}${order}`);
  const rows = await query(sqlClient, prep(args));

  // This resolver is used for the main UI page and is quite slow. Since we've
  // already authorized the user has access to all the projects we are
  // returning, AND all user roles are allowed to view all environments, we can
  // short-circuit the slow keycloak check in the getEnvironmentsByProjectId
  // resolver.
  //
  // @TODO: When this performance issue is fixed for real, remove this hack as
  // it hardcodes a "everyone can view environments" authz rule.
  return rows.map(row => ({ ...row, environmentAuthz: true }));
};

const getProjectByEnvironmentId = async (
  { id: eid },
  args,
  {
    sqlClient,
    hasPermission,
  },
) => {
  const prep = prepare(
    sqlClient,
    `SELECT
        p.*
      FROM environment e
      JOIN project p ON e.project = p.id
      WHERE e.id = :eid
      LIMIT 1
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));

  const project = rows[0];

  await hasPermission('project', 'view', {
    project: project.id,
  });

  try {
    await hasPermission('project', 'viewPrivateKey', {
      project: project.id,
    });

    return project;
  } catch (err) {
    return removePrivateKey(project);
  }
};

const getProjectByGitUrl = async (
  root,
  args,
  {
    sqlClient,
    hasPermission,
  },
) => {
  const str = `
      SELECT
        *
      FROM project
      WHERE git_url = :git_url
      LIMIT 1
    `;

  const prep = prepare(sqlClient, str);
  const rows = await query(sqlClient, prep(args));

  const project = rows[0];

  await hasPermission('project', 'view', {
    project: project.id,
  });

  try {
    await hasPermission('project', 'viewPrivateKey', {
      project: project.id,
    });

    return project;
  } catch (err) {
    return removePrivateKey(project);
  }
};

const getProjectByName = async (
  root,
  args,
  {
    sqlClient,
    hasPermission,
  },
) => {
  const str = `
      SELECT
        *
      FROM project
      WHERE name = :name
    `;

  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep(args));
  const project = rows[0];

  await hasPermission('project', 'view', {
    project: project.id,
  });

  try {
    await hasPermission('project', 'viewPrivateKey', {
      project: project.id,
    });

    return project;
  } catch (err) {
    return removePrivateKey(project);
  }
};


const getProjectsByMetadata = async (
  root,
  args,
  {
    sqlClient,
    hasPermission,
  },
) => {

  let where = '';
  try {
    await hasPermission('project', 'viewAll');
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getAllProjects');
      return [];
    }

    const userProjectIds = await models.UserModel.getAllProjectsIdsForUser({
      id: keycloakGrant.access_token.content.sub,
    });

    where = whereAnd([
      inClause('id', userProjectIds),
    ]);
  }

  for (const meta of args['metadata']) {

    let key = meta['key'];
    let val = meta['value'];

    var q = `JSON_CONTAINS(metadata, '"`+val+`"', '$.`+key+`')`;

    // Support key-only queries.
    if (!val) {
      q = `JSON_CONTAINS_PATH(metadata, 'one', '$.`+key+`')`;
    }

    if (where === '') {
      where += ` WHERE ` + q;
    }
    else {
      where += ` AND ` + q;
    }
  }

  logger.error(`SELECT * FROM project ${where}`);

  const order = args.order ? ` ORDER BY ${R.toLower(args.order)} ASC` : '';
  const prep = prepare(sqlClient, `SELECT * FROM project ${where}${order}`);
  const rows = await query(sqlClient, prep(args));

  return rows;
};

const addProject = async (
  root,
  { input },
  {
    hasPermission,
    sqlClient,
    models,
    keycloakGrant,
  },
) => {
  await hasPermission('project', 'add');

  if (validator.matches(input.name, /[^0-9a-z-]/)) {
    throw new Error(
      'Only lowercase characters, numbers and dashes allowed for name!',
    );
  }
  if (!isValidGitUrl(input.gitUrl)) {
    throw new Error('The provided gitUrl is invalid.',);
  }

  let keyPair = {};
  try {
    const privateKey = R.cond([
      [R.isNil, generatePrivateKey],
      [R.isEmpty, generatePrivateKey],
      [R.T, sshpk.parsePrivateKey],
    ])(R.prop('privateKey', input));

    const publicKey = privateKey.toPublic();

    keyPair = {
      ...keyPair,
      private: R.replace(/\n/g, '\n', privateKey.toString('openssh')),
      public: publicKey.toString(),
    };
  } catch (err) {
    throw new Error(`There was an error with the privateKey: ${err.message}`);
  }

  const prep = prepare(
    sqlClient,
    `CALL CreateProject(
        :id,
        :name,
        :git_url,
        ${input.availability ? ':availability' : '"STANDARD"'},
        :private_key,
        ${input.subfolder ? ':subfolder' : 'NULL'},
        :openshift,
        ${
  input.openshiftProjectPattern ? ':openshift_project_pattern' : 'NULL'
},
        ${
  input.activeSystemsDeploy
    ? ':active_systems_deploy'
    : '"lagoon_openshiftBuildDeploy"'
},
        ${
  input.activeSystemsPromote
    ? ':active_systems_promote'
    : '"lagoon_openshiftBuildDeploy"'
},
        ${
  input.activeSystemsRemove
    ? ':active_systems_remove'
    : '"lagoon_openshiftRemove"'
},
        ${
  input.activeSystemsTask
    ? ':active_systems_task'
    : '"lagoon_openshiftJob"'
},
        ${
  input.activeSystemsMisc
    ? ':active_systems_misc'
    : '"lagoon_openshiftMisc"'
},
        ${input.branches ? ':branches' : '"true"'},
        ${input.pullrequests ? ':pullrequests' : '"true"'},
        ${input.productionEnvironment ? ':production_environment' : 'NULL'},
        ${input.productionRoutes ? ':production_routes' : 'NULL'},
        ${input.productionAlias ? ':production_alias' : '"lagoon-production"'},
        ${input.standbyProductionEnvironment ? ':standby_production_environment' : 'NULL'},
        ${input.standbyRoutes ? ':standby_routes' : 'NULL'},
        ${input.standbyAlias ? ':standby_alias' : '"lagoon-standby"'},
        ${input.autoIdle ? ':auto_idle' : '1'},
        ${input.storageCalc ? ':storage_calc' : '1'},
        ${
  input.developmentEnvironmentsLimit
    ? ':development_environments_limit'
    : '5'
}
      );
    `,
  );

  const rows = await query(sqlClient, prep({
    ...input,
    privateKey: keyPair.private,
  }));
  const project = R.path([0, 0], rows);

  // Create a default group for this project
  let group;
  try {
    group = await models.GroupModel.addGroup({
      name: `project-${project.name}`,
      attributes: {
        type: ['project-default-group'],
        'lagoon-projects': [project.id],
      },
    });
  } catch (err) {
    logger.error(`Could not create default project group for ${project.name}: ${err.message}`);
  }

  OpendistroSecurityOperations(sqlClient, models.GroupModel).syncGroup(`project-${project.name}`, project.id);

  // Find or create a user that has the public key linked to them
  const userRows = await query(
    sqlClient,
    sshKeySql.selectUserIdsBySshKeyFingerprint(getSshKeyFingerprint(keyPair.public)),
  );
  const userId = R.path([0, 'usid'], userRows);

  let user;
  if (!userId) {
    try {
      user = await models.UserModel.addUser({
        email: `default-user@${project.name}`,
        username: `default-user@${project.name}`,
        comment: `autogenerated user for project ${project.name}`,
      });

      const keyParts = keyPair.public.split(' ');

      const {
        info: { insertId },
      } = await query(
        sqlClient,
        sshKeySql.insertSshKey({
          id: null,
          name: 'auto-add via api',
          keyValue: keyParts[1],
          keyType: keyParts[0],
          keyFingerprint: getSshKeyFingerprint(keyPair.public),
        }),
      );
      await query(sqlClient, sshKeySql.addSshKeyToUser({ sshKeyId: insertId, userId: user.id }));
    } catch (err) {
      logger.error(`Could not create default project user for ${project.name}: ${err.message}`);
    }
  } else {
    user = await models.UserModel.loadUserById(userId);
  }

  // Add the user (with linked public key) to the default group with maintainer role
  try {
    await models.GroupModel.addUserToGroup(user, group, 'maintainer');
  } catch (err) {
    logger.error(`Could not link user to default projet group for ${project.name}: ${err.message}`);
  }

  // Add the user who submitted this request to the project
  let userAlreadyHasAccess;
  try {
    await hasPermission('project', 'viewAll');
    userAlreadyHasAccess = true;
  } catch(e) {
    userAlreadyHasAccess = false;
  }

  if (!userAlreadyHasAccess && keycloakGrant) {
    const user = await models.UserModel.loadUserById(
      keycloakGrant.access_token.content.sub,
    );

    try {
      await models.GroupModel.addUserToGroup(user, group, 'owner');
    } catch (err) {
      logger.error(`Could not link requesting user to default projet group for ${project.name}: ${err.message}`);
    }
  }

  const harborOperations = createHarborOperations(sqlClient);

  const harborResults = await harborOperations.addProject(project.name, project.id)

  return project;
};

const deleteProject = async (
  root,
  { input: { project: projectName } },
  {
    sqlClient,
    hasPermission,
    models,
  },
) => {
  // Will throw on invalid conditions
  const pid = await Helpers(sqlClient).getProjectIdByName(projectName);
  const project = await Helpers(sqlClient).getProjectById(pid);

  await hasPermission('project', 'delete', {
    project: pid,
  });

  const prep = prepare(sqlClient, 'CALL DeleteProject(:name)');
  await query(sqlClient, prep(project));

  // Remove the default group and user
  try {
    const group = await models.GroupModel.loadGroupByName(`project-${project.name}`);
    await models.GroupModel.deleteGroup(group.id);
    OpendistroSecurityOperations(sqlClient, models.GroupModel).deleteGroup(group.name);
  } catch (err) {
    logger.error(`Could not delete default group for project ${project.name}: ${err.message}`);
  }

  try {
    const user = await models.UserModel.loadUserByUsername(`default-user@${project.name}`);
    await models.UserModel.deleteUser(user.id);
  } catch (err) {
    logger.error(`Could not delete default user for project ${project.name}: ${err.message}`);
  }

  return 'success';
};

const updateProject = async (
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
        activeSystemsDeploy,
        activeSystemsRemove,
        activeSystemsTask,
        activeSystemsMisc,
        branches,
        productionEnvironment,
        productionRoutes,
        productionAlias,
        standbyProductionEnvironment,
        standbyRoutes,
        standbyAlias,
        autoIdle,
        storageCalc,
        pullrequests,
        openshift,
        openshiftProjectPattern,
        developmentEnvironmentsLimit,
      },
    },
  },
  {
    sqlClient,
    hasPermission,
    models,
  },
) => {
  await hasPermission('project', 'update', {
    project: id,
  });

  if (isPatchEmpty({ patch })) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  if (typeof name === 'string') {
    if (validator.matches(name, /[^0-9a-z-]/)) {
      throw new Error(
        'Only lowercase characters, numbers and dashes allowed for name!',
      );
    }
  }

  if (gitUrl !== undefined && !isValidGitUrl(gitUrl)) {
    throw new Error('The provided gitUrl is invalid.',);
  }

  const oldProject = await Helpers(sqlClient).getProjectById(id);

  // TODO If the privateKey changes, automatically remove the old one from the
  // default user and link the new one.

  // const originalProject = await Helpers(sqlClient).getProjectById(id);
  // const originalName = R.prop('name', originalProject);
  // const originalCustomer = parseInt(R.prop('customer', originalProject));

  // // If the project will be updating the `name` or `customer` fields, update Keycloak groups and users accordingly
  // if (typeof customer === 'number' && customer !== originalCustomer) {
  //   // Delete Keycloak users from original projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
  //   await Helpers(sqlClient).mapIfNoDirectProjectAccess(
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
    sqlClient,
    Sql.updateProject({
      id,
      patch: {
        name,
        gitUrl,
        availability,
        privateKey,
        subfolder,
        activeSystemsDeploy,
        activeSystemsRemove,
        activeSystemsTask,
        activeSystemsMisc,
        branches,
        productionEnvironment,
        productionRoutes,
        productionAlias,
        standbyProductionEnvironment,
        standbyRoutes,
        standbyAlias,
        autoIdle,
        storageCalc,
        pullrequests,
        openshift,
        openshiftProjectPattern,
        developmentEnvironmentsLimit,
      },
    }),
  );

  // Rename the default group and user
  if (patch.name && oldProject.name !== patch.name) {
    try {
      const group = await models.GroupModel.loadGroupByName(`project-${oldProject.name}`);
      await models.GroupModel.updateGroup({
        id: group.id,
        name: `project-${patch.name}`,
      });
    } catch (err) {
      logger.error(`Could not rename default group for project ${patch.name}: ${err.message}`);
    }

    try {
      const user = await models.UserModel.loadUserByUsername(`default-user@${oldProject.name}`);
      await models.UserModel.updateUser({
        id: user.id,
        email: `default-user@${patch.name}`,
        username: `default-user@${patch.name}`,
        comment: `autogenerated user for project ${patch.name}`,
      });
    } catch (err) {
      logger.error(`Could not rename default user for project ${patch.name}: ${err.message}`);
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
  //   await Helpers(sqlClient).mapIfNoDirectProjectAccess(
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

  return Helpers(sqlClient).getProjectById(id);
};


const deleteAllProjects = async (
  root,
  args,
  { sqlClient, hasPermission },
) => {
  await hasPermission('project', 'deleteAll');

  const projectNames = await Helpers(sqlClient).getAllProjectNames();

  await query(sqlClient, Sql.truncateProject());

  for (const name of projectNames) {
    await KeycloakOperations.deleteGroup(name);
  }

  // TODO: Check rows for success
  return 'success';
};


const removeProjectMetadataByKey = async (
  root,
  {
    input: {
      id,
      key,
    },
  },
  {
    sqlClient,
    hasPermission,
    models,
  },
) => {

  await hasPermission('project', 'update', {
    project: id,
  });

  if (!key) {
    throw new Error('key to remove is required');
  }

  if (typeof key === 'string') {
    if (validator.matches(key, /[^0-9a-z-]/)) {
      throw new Error(
        'Only lowercase characters, numbers and dashes allowed for key!',
      );
    }
  }

  const oldProject = await Helpers(sqlClient).getProjectById(id);

  const str = `
      UPDATE project
      SET metadata = JSON_REMOVE(metadata, '$.`+ key + `')
      WHERE id = `+ id + `
    `;

  const prep = prepare(sqlClient, str);
  await query(sqlClient, prep(oldProject));
  return Helpers(sqlClient).getProjectById(id);
};


const updateProjectMetadata = async (
  root,
  {
    input: {
      id,
      patch,
      patch: {
        key,
        value,
      },
    },
  },
  {
    sqlClient,
    hasPermission,
    models,
  },
) => {

  await hasPermission('project', 'update', {
    project: id,
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
        'Only lowercase characters, numbers and dashes allowed for key!',
      );
    }
  }

  const oldProject = await Helpers(sqlClient).getProjectById(id);

  const str = `
      UPDATE project
      SET metadata = JSON_SET(metadata, '$.`+key+`', '`+value+`')
      WHERE id = `+id+`
    `;

  const prep = prepare(sqlClient, str);
  await query(sqlClient, prep(oldProject));
  return Helpers(sqlClient).getProjectById(id);
};

const Resolvers /* : ResolversObj */ = {
  deleteProject,
  addProject,
  getProjectByName,
  getProjectByGitUrl,
  getProjectByEnvironmentId,
  getAllProjects,
  getProjectsByMetadata,
  updateProject,
  deleteAllProjects,
  updateProjectMetadata,
  removeProjectMetadataByKey,
};

module.exports = Resolvers;
