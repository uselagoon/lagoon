const R = require('ramda');
const {
  isPatchEmpty, knex, prepare, query,
} = require('./utils');

const Sql = {
  updateEnvironment: (cred, input) => {
    const { name, patch } = input;

    return knex('environment')
      .where('name', '=', name)
      .update(patch)
      .toString();
  },
  selectEnvironmentByName: name =>
    knex('environment')
      .where('name', '=', name)
      .toString(),
};

const getEnvironmentsByProjectId = sqlClient => async (cred, pid, args) => {
  const { projects } = cred.permissions;

  if (cred.role !== 'admin' && !R.contains(pid, projects)) {
    throw new Error('Unauthorized');
  }

  const prep = prepare(
    sqlClient,
    `SELECT
        *
      FROM environment e
      WHERE e.project = :pid
      ${args.type ? 'AND e.environment_type = :type' : ''}
    `,
  );

  const rows = await query(sqlClient, prep({ pid, type: args.type }));

  return rows;
};

const getEnvironmentByOpenshiftProjectName = sqlClient => async (cred, args) => {
  const { customers, projects } = cred.permissions;
  const str = `
      SELECT
        e.*
      FROM environment e
        JOIN project p ON e.project = p.id
        JOIN customer c ON p.customer = c.id
      WHERE e.openshift_projectname = :openshiftProjectName
      ${ifNotAdmin(
        cred.role,
        `AND (${inClauseOr([
          ['c.id', customers],
          ['p.id', projects],
        ])})`,
      )}
    `;

  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep(args));

  return rows[0];
};

const addOrUpdateEnvironment = sqlClient => async (cred, input) => {
  const { projects } = cred.permissions;
  const pid = input.project.toString();

  if (cred.role !== 'admin' && !R.contains(pid, projects)) {
    throw new Error('Project creation unauthorized.');
  }
  const prep = prepare(
    sqlClient,
    `CALL CreateOrUpdateEnvironment(
        :name,
        :project,
        :deploy_type,
        :environment_type,
        :openshift_projectname
      );
    `,
  );

  const rows = await query(sqlClient, prep(input));
  const environment = R.path([0, 0], rows);

  return environment;
};

const deleteEnvironment = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const prep = prepare(sqlClient, 'CALL DeleteEnvironment(:name, :project)');
  const rows = await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const updateEnvironment = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const name = input.name;
  await query(sqlClient, Sql.updateEnvironment(cred, input));

  const rows = await query(sqlClient, Sql.selectEnvironmentByName(name));

  return R.prop(0, rows);
};

const Queries = {
  addOrUpdateEnvironment,
  getEnvironmentByOpenshiftProjectName,
  deleteEnvironment,
  getEnvironmentsByProjectId,
  updateEnvironment,
};

module.exports = {
  Sql,
  Queries,
};
