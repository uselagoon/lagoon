// @flow

const R = require('ramda');
const logger = require('../logger');
const {
  ifNotAdmin,
  inClauseOr,
  knex,
  prepare,
  query,
  whereAnd,
  isPatchEmpty,
} = require('./utils');

// This contains the sql query generation logic
const Sql = {
  updateProject: ({ permissions: { projects } }, { id, patch }) =>
    knex('project')
      .where('id', '=', id)
      .whereIn('id', projects)
      .update(patch)
      .toString(),
  selectProject: (id /* : number */) =>
    knex('project')
      .where('id', id)
      .toString(),
  selectProjectIdByName: name =>
    knex('project')
      .where('name', name)
      .select('id')
      .toString(),
  selectProjectIdsByCustomerIds: customerIds =>
    knex('project')
      .select('id')
      .whereIn('customer', customerIds)
      .toString(),
  selectCustomer: id =>
    knex('customer')
      .where('id', id)
      .toString(),
  truncateProject: () =>
    knex('project')
      .truncate()
      .toString(),
};

const Helpers = {
  getProjectById: async (sqlClient, id) => {
    const rows = await query(sqlClient, Sql.selectProject(id));
    return R.prop(0, rows);
  },
  getProjectIdByName: async (sqlClient, name) => {
    const pidResult = await query(sqlClient, Sql.selectProjectIdByName(name));

    const amount = R.length(pidResult);
    if (amount > 1) {
      throw new Error(
        `Multiple project candidates for '${name}' (${amount} found). Do nothing.`,
      );
    }

    if (amount === 0) {
      throw new Error(`Not found: '${name}'`);
    }

    const pid = R.path(['0', 'id'], pidResult);

    return pid;
  },
  getProjectIdsByCustomerIds: async (sqlClient, customerIds) =>
    query(sqlClient, Sql.selectProjectIdsByCustomerIds(customerIds)),
  getCustomerByCustomerId: async (sqlClient, id) => {
    const rows = await query(sqlClient, Sql.selectCustomer(id));
    return R.prop(0, rows);
  },
};

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
        ${input.storageCalc ? ':storage_calc' : '1'}
      );
    `,
  );

  const rows = await query(sqlClient, prep(input));
  const project = R.path([0, 0], rows);

  try {
    // Create a group in Keycloak named the same as the project
    await keycloakClient.groups.create({
      name: R.prop('name', project),
    });
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

const deleteProject = ({ sqlClient, searchguardClient }) => async (
  cred,
  input,
) => {
  const { projects } = cred.permissions;

  // Will throw on invalid conditions
  const pid = await Helpers.getProjectIdByName(sqlClient, input.project);

  if (cred.role !== 'admin') {
    if (!R.contains(pid, projects)) {
      throw new Error('Unauthorized.');
    }
  }

  const prep = prepare(sqlClient, 'CALL DeleteProject(:project)');
  await query(sqlClient, prep(input));

  try {
    // Delete SearchGuard Role for this project with the same name as the Project
    await searchguardClient.delete(`roles/${input.project}`);
  } catch (err) {
    logger.error(`SearchGuard delete role error: ${err}`);
    throw new Error(`SearchGuard delete role error: ${err}`);
  }
  // TODO: maybe check rows for changed result
  return 'success';
};

const updateProject = ({ sqlClient }) => async (cred, input) => {
  const { projects } = cred.permissions;
  const pid = input.id.toString();

  if (cred.role !== 'admin' && !R.contains(pid, projects)) {
    throw new Error('Unauthorized');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClient, Sql.updateProject(cred, input));
  return Helpers.getProjectById(pid);
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
  Sql,
  Queries: {
    deleteProject,
    addProject,
    getProjectByName,
    getProjectByGitUrl,
    getProjectByEnvironmentId,
    getAllProjects,
    updateProject,
    deleteAllProjects,
  },
  Helpers,
};
