// @flow

const R = require('ramda');
const validator = require('validator');
const keycloakClient = require('../../clients/keycloakClient');
const searchguardClient = require('../../clients/searchguardClient');
const sqlClient = require('../../clients/sqlClient');
const logger = require('../../logger');
const {
  ifNotAdmin,
  inClauseOr,
  prepare,
  query,
  whereAnd,
  isPatchEmpty,
} = require('../../util/db');

const Helpers = require('./helpers');
const KeycloakOperations = require('./keycloak');
const SearchguardOperations = require('./searchguard');
const Sql = require('./sql');

/* ::

import type {ResolversObj} from '../';

*/

const getAllProjects = async (
  root,
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  // We need one "WHERE" keyword, but we have multiple optional conditions
  const where = whereAnd([
    args.createdAfter ? 'created >= :created_after' : '',
    args.gitUrl ? 'git_url = :git_url' : '',
    ifNotAdmin(
      role,
      `(${inClauseOr([['customer', customers], ['project.id', projects]])})`,
    ),
  ]);

  const prep = prepare(sqlClient, `SELECT * FROM project ${where}`);
  const rows = await query(sqlClient, prep(args));

  return rows;
};

const getProjectByEnvironmentId = async (
  { id: eid },
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const prep = prepare(
    sqlClient,
    `SELECT
        p.*
      FROM environment e
      JOIN project p ON e.project = p.id
      WHERE e.id = :eid
      ${ifNotAdmin(
    role,
    `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
  )}
      LIMIT 1
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));

  return rows ? rows[0] : null;
};

const getProjectByGitUrl = async (
  root,
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const str = `
      SELECT
        *
      FROM project
      WHERE git_url = :git_url
      ${ifNotAdmin(
    role,
    `AND (${inClauseOr([
      ['customer', customers],
      ['project.id', projects],
    ])})`,
  )}
      LIMIT 1
    `;

  const prep = prepare(sqlClient, str);
  const rows = await query(sqlClient, prep(args));

  return rows ? rows[0] : null;
};

const getProjectByName = async (
  root,
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const str = `
      SELECT
        *
      FROM project
      WHERE name = :name
      ${ifNotAdmin(
    role,
    `AND (${inClauseOr([
      ['customer', customers],
      ['project.id', projects],
    ])})`,
  )}
    `;

  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep(args));
  return rows[0];
};

const addProject = async (
  root,
  { input },
  {
    credentials: {
      role,
      permissions: { customers },
    },
  },
) => {
  const cid = input.customer.toString();

  if (role !== 'admin' && !R.contains(cid, customers)) {
    throw new Error('Project creation unauthorized.');
  }

  if (validator.matches(input.name, /[^0-9a-z-]/)) {
    throw new Error('Only lowercase characters, numbers and dashes allowed for name!');
  }

  const prep = prepare(
    sqlClient,
    `CALL CreateProject(
        :id,
        :name,
        :customer,
        :git_url,
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
        ${input.branches ? ':branches' : '"true"'},
        ${input.pullrequests ? ':pullrequests' : '"true"'},
        ${input.productionEnvironment ? ':production_environment' : 'NULL'},
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

  const rows = await query(sqlClient, prep(input));
  const project = R.path([0, 0], rows);

  await KeycloakOperations.addGroup(project);
  await SearchguardOperations.addProject(project);

  return project;
};

const deleteProject = async (
  root,
  { input: { project } },
  {
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  // Will throw on invalid conditions
  const pid = await Helpers.getProjectIdByName(project);

  if (role !== 'admin') {
    if (!R.contains(pid, projects)) {
      throw new Error('Unauthorized.');
    }
  }

  const prep = prepare(sqlClient, 'CALL DeleteProject(:project)');
  await query(sqlClient, prep({ project }));

  await KeycloakOperations.deleteGroup(project);

  try {
    // Delete SearchGuard Role for this project with the same name as the Project
    await searchguardClient.delete(`roles/${project}`);
  } catch (err) {
    logger.error(`SearchGuard delete role error: ${err}`);
    throw new Error(`SearchGuard delete role error: ${err}`);
  }
  // TODO: maybe check rows for changed result
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
        customer,
        gitUrl,
        subfolder,
        activeSystemsDeploy,
        activeSystemsRemove,
        activeSystemsTask,
        branches,
        productionEnvironment,
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
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  if (role !== 'admin' && !R.contains(id.toString(), projects)) {
    throw new Error('Unauthorized');
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  if (typeof name === 'string') {
    if (validator.matches(name, /[^0-9a-z-]/)) {
      throw new Error('Only lowercase characters, numbers and dashes allowed for name!');
    }
  }

  const originalProject = await Helpers.getProjectById(id);
  const originalName = R.prop('name', originalProject);
  const originalCustomer = parseInt(R.prop('customer', originalProject));

  // If the project will be updating the `name` or `customer` fields, update Keycloak groups and users accordingly
  if (typeof customer === 'number' && customer !== originalCustomer) {
    // Delete Keycloak users from original projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
    await Helpers.mapIfNoDirectProjectAccess(
      id,
      originalCustomer,
      async ({
        keycloakUserId,
        keycloakUsername,
        keycloakGroupId,
        keycloakGroupName,
      }) => {
        await keycloakClient.users.delFromGroup({
          id: keycloakUserId,
          groupId: keycloakGroupId,
        });
        logger.debug(
          `Removed Keycloak user ${keycloakUsername} from group "${keycloakGroupName}"`,
        );
      },
    );
  }

  await query(
    sqlClient,
    Sql.updateProject({
      id,
      patch: {
        name,
        customer,
        gitUrl,
        subfolder,
        activeSystemsDeploy,
        activeSystemsRemove,
        activeSystemsTask,
        branches,
        productionEnvironment,
        autoIdle,
        storageCalc,
        pullrequests,
        openshift,
        openshiftProjectPattern,
        developmentEnvironmentsLimit,
      },
    }),
  );

  if (typeof name === 'string' && name !== originalName) {
    const groupId = await KeycloakOperations.findGroupIdByName(originalName);

    await keycloakClient.groups.update({ id: groupId }, { name });
    logger.debug(
      `Renamed Keycloak group ${groupId} from "${originalName}" to "${name}"`,
    );
  }

  if (typeof customer === 'number' && customer !== originalCustomer) {
    // Add Keycloak users to new projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
    await Helpers.mapIfNoDirectProjectAccess(
      id,
      customer,
      async ({
        keycloakUserId,
        keycloakUsername,
        keycloakGroupId,
        keycloakGroupName,
      }) => {
        await keycloakClient.users.addToGroup({
          id: keycloakUserId,
          groupId: keycloakGroupId,
        });
        logger.debug(
          `Added Keycloak user ${keycloakUsername} to group "${keycloakGroupName}"`,
        );
      },
    );
  }

  return Helpers.getProjectById(id);
};


const createAllProjectsInKeycloak = async (root, args, {
  credentials: {
    role,
  },
}) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const projects = await query(sqlClient, Sql.selectAllProjects());

  for (const project of projects) {
    await KeycloakOperations.addGroup(project);
  }


  return 'success';
};

const createAllProjectsInSearchguard = async (root, args, {
  credentials: {
    role,
  },
}) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const projects = await query(sqlClient, Sql.selectAllProjects());

  for (const project of projects) {
    await SearchguardOperations.addProject(project);
  }

  return 'success';
};


const deleteAllProjects = async (root, args, {
  credentials: {
    role,
  },
}) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const projectNames = await Helpers.getAllProjectNames();

  await query(sqlClient, Sql.truncateProject());

  for (const name of projectNames) {
    await KeycloakOperations.deleteGroup(name);
  }

  // TODO: Check rows for success
  return 'success';
};

const Resolvers /* : ResolversObj */ = {
  deleteProject,
  addProject,
  getProjectByName,
  getProjectByGitUrl,
  getProjectByEnvironmentId,
  getAllProjects,
  updateProject,
  deleteAllProjects,
  createAllProjectsInKeycloak,
  createAllProjectsInSearchguard,
};

module.exports = Resolvers;
