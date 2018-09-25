const R = require('ramda');
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
  updateProject: ({ id, patch }) => {

    const ret = knex('project')
      .where('id', '=', id)
      .update(patch);

    return ret.toString();
  },
  selectProject: id =>
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

const addProject = ({ sqlClient }) => async (cred, input) => {
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

  return project;
};

const deleteProject = ({ sqlClient }) => async (cred, input) => {
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

  await query(sqlClient, Sql.updateProject(input));
  return Helpers.getProjectById(pid);
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
  },
  Helpers,
};
