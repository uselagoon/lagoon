const R = require('ramda');
const {
  knex,
  ifNotAdmin,
  whereAnd,
  inClause,
  inClauseOr,
  query,
  prepare,
} = require('./utils');

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

  const rows = await query(sqlClient, prep({ pid: pid, type: args.type }));

  return rows;
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

module.exports = {
  addOrUpdateEnvironment,
  deleteEnvironment,
  getEnvironmentsByProjectId,
};
