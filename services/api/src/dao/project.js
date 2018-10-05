// @flow

const R = require('ramda');
const logger = require('../logger');
const {
  ifNotAdmin,
  inClauseOr,
  prepare,
  query,
  whereAnd,
  isPatchEmpty,
} = require('./utils');

// TEMPORARY: Don't copy this `project.helpers`, etc file naming structure.
// This is just temporarily here to avoid the problems from the circular dependency between the `project` and `user` helpers.
//
// Eventually we should move to a better folder structure and away from the DAO structure. Example folder structure: https://github.com/sysgears/apollo-universal-starter-kit/tree/e2c43fcfdad8b2a4a3ca0b491bbd1493fcaee255/packages/server/src/modules/post
const Helpers = require('./project.helpers');
const KeycloakOperations = require('./project.keycloak');
const Sql = require('./project.sql');

const getAllProjects = ({ sqlClient }) => async (cred, args) => {
  const { customers, projects } = cred.permissions;
  // We need one "WHERE" keyword, but we have multiple optional conditions
  const where = whereAnd([
    args.createdAfter ? 'created >= :created_after' : '',
    args.gitUrl ? 'git_url = :git_url' : '',
    ifNotAdmin(
      cred.role,
      `(${inClauseOr([['customer', customers], ['project.id', projects]])})`,
    ),
  ]);

  const prep = prepare(sqlClient, `SELECT * FROM project ${where}`);
  const rows = await query(sqlClient, prep(args));

  return rows;
};

const getProjectByEnvironmentId = ({ sqlClient }) => async (cred, eid) => {
  const { customers, projects } = cred.permissions;
  const prep = prepare(
    sqlClient,
    `SELECT
        p.*
      FROM environment e
      JOIN project p ON e.project = p.id
      WHERE e.id = :eid
      ${ifNotAdmin(
    cred.role,
    `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
  )}
      LIMIT 1
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));

  return rows ? rows[0] : null;
};

const getProjectByGitUrl = ({ sqlClient }) => async (cred, args) => {
  const { customers, projects } = cred.permissions;
  const str = `
      SELECT
        *
      FROM project
      WHERE git_url = :git_url
      ${ifNotAdmin(
    cred.role,
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

const getProjectByName = ({ sqlClient }) => async (cred, args) => {
  const { customers, projects } = cred.permissions;
  const str = `
      SELECT
        *
      FROM project
      WHERE name = :name
      ${ifNotAdmin(
    cred.role,
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

const addProject = ({
  sqlClient,
  keycloakClient,
  searchguardClient,
  kibanaClient,
}) => async (cred, input) => {
  const { customers } = cred.permissions;
  const cid = input.customer.toString();

  if (cred.role !== 'admin' && !R.contains(cid, customers)) {
    throw new Error('Project creation unauthorized.');
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

  try {
    // Create a group in Keycloak named the same as the project
    const name = R.prop('name', project);
    await keycloakClient.groups.create({
      name,
    });
    logger.debug(`Created Keycloak group with name "${name}"`);
  } catch (err) {
    if (err.response.status === 409) {
      logger.warn(
        `Failed to create already existing Keycloak group "${R.prop(
          'name',
          project,
        )}"`,
      );
    } else {
      logger.error(`SearchGuard create role error: ${err}`);
      throw new Error(`SearchGuard create role error: ${err}`);
    }
  }

  const customer = await Helpers.getCustomerByCustomerId(
    sqlClient,
    project.customer,
  );

  try {
    // Create a new SearchGuard Role for this project with the same name as the Project
    await searchguardClient.put(`roles/${project.name}`, {
      body: {
        indices: {
          [`*-${project.name}-*`]: {
            '*': ['READ'],
          },
        },
        tenants: {
          [customer.name]: 'RW',
        },
      },
    });
  } catch (err) {
    logger.error(`SearchGuard create role error: ${err}`);
    throw new Error(`SearchGuard create role error: ${err}`);
  }

  // Create index-patterns for this project
  for (const log of [
    'application-logs',
    'router-logs',
    'container-logs',
    'lagoon-logs',
  ]) {
    try {
      await kibanaClient.post(
        `saved_objects/index-pattern/${log}-${project.name}-*`,
        {
          body: {
            attributes: {
              title: `${log}-${project.name}-*`,
            },
          },
          headers: {
            sgtenant: customer.name,
          },
        },
      );
    } catch (err) {
      // 409 Errors are expected and mean that there is already an index-pattern with that name defined, we ignore them
      if (err.statusCode !== 409) {
        logger.error(
          `Kibana Error during setup of index pattern ${log}-${
            project.name
          }-*: ${err}`,
        );
        // Don't fail if we have Kibana Errors, as they are "non-critical"
      }
    }
  }

  try {
    const currentSettings = await kibanaClient.get('kibana/settings', {
      headers: {
        sgtenant: customer.name,
      },
    });

    // Define a default Index if there is none yet
    if (!currentSettings.body.settings.defaultIndex) {
      await kibanaClient.post('kibana/settings', {
        body: {
          changes: {
            defaultIndex: `container-logs-${project.name}-*`,
            'telemetry:optIn': false, // also opt out of telemetry from xpack
          },
        },
        headers: {
          sgtenant: customer.name,
        },
      });
    }
  } catch (err) {
    logger.error(`Kibana Error during config of default Index: ${err}`);
    // Don't fail if we have Kibana Errors, as they are "non-critical"
  }

  return project;
};

const deleteProject = ({
  sqlClient,
  keycloakClient,
  searchguardClient,
}) => async (cred, { project }) => {
  const { projects } = cred.permissions;

  // Will throw on invalid conditions
  const pid = await Helpers.getProjectIdByName(sqlClient, project);

  if (cred.role !== 'admin') {
    if (!R.contains(pid, projects)) {
      throw new Error('Unauthorized.');
    }
  }

  const prep = prepare(sqlClient, 'CALL DeleteProject(:project)');
  await query(sqlClient, prep({ project }));

  await KeycloakOperations.deleteGroup(keycloakClient, project);

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

const updateProject = ({ sqlClient, keycloakClient }) => async (
  { role, permissions: { projects } },
  {
    id,
    patch,
    patch: {
      name,
      customer,
      gitUrl,
      subfolder,
      activeSystemsDeploy,
      activeSystemsRemove,
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
) => {
  if (role !== 'admin' && !R.contains(id.toString(), projects)) {
    throw new Error('Unauthorized');
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const originalProject = await Helpers.getProjectById(sqlClient, id);
  const originalName = R.prop('name', originalProject);
  const originalCustomer = parseInt(R.prop('customer', originalProject));

  // If the project will be updating the `name` or `customer` fields, update Keycloak groups and users accordingly
  if (typeof customer === 'number' && customer !== originalCustomer) {
    // Delete Keycloak users from original projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
    await Helpers.mapIfNoDirectProjectAccess(
      sqlClient,
      keycloakClient,
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
    const groupId = await KeycloakOperations.findGroupIdByName(
      keycloakClient,
      originalName,
    );

    await keycloakClient.groups.update({ id: groupId }, { name });
    logger.debug(
      `Renamed Keycloak group ${groupId} from "${originalName}" to "${name}"`,
    );
  }

  if (typeof customer === 'number' && customer !== originalCustomer) {
    // Add Keycloak users to new projects where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
    await Helpers.mapIfNoDirectProjectAccess(
      sqlClient,
      keycloakClient,
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

  return Helpers.getProjectById(sqlClient, id);
};

const deleteAllProjects = ({ sqlClient }) => async ({ role }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateProject());

  // TODO: Check rows for success
  return 'success';
};

module.exports = {
  Resolvers: {
    deleteProject,
    addProject,
    getProjectByName,
    getProjectByGitUrl,
    getProjectByEnvironmentId,
    getAllProjects,
    updateProject,
    deleteAllProjects,
  },
};
