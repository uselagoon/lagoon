// @flow

const R = require('ramda');
const {
  knex,
  ifNotAdmin,
  inClauseOr,
  prepare,
  query,
  isPatchEmpty,
} = require('./utils');

const Sql = {
  selectDeployment: id =>
    knex('deployment')
      .where('id', '=', id)
      .toString(),
  insertDeployment: ({
    id,
    name,
    status,
    created,
    started,
    completed,
    environment,
    remoteId,
  }) =>
    knex('deployment')
      .insert({
        id,
        name,
        status,
        created,
        started,
        completed,
        environment,
        remoteId,
      })
      .toString(),
  deleteDeployment: id =>
    knex('deployment')
      .where('id', id)
      .del()
      .toString(),
  updateDeployment: ({ id, patch }) =>
    knex('deployment')
      .where('id', id)
      .update(patch)
      .toString(),
  selectPermsForDeployment: id =>
    knex('devployment')
      .select({ pid: 'project.id', cid: 'project.customer' })
      .join('environment', 'deployment.environment', '=', 'environment.id')
      .join('project', 'environment.project', '=', 'project.id')
      .where('deployment.id', id)
      .toString(),
  selectPermsForEnvironment: id =>
    knex('environment')
      .select({ pid: 'project.id', cid: 'project.customer' })
      .join('project', 'environment.project', '=', 'project.id')
      .where('environment.id', id)
      .toString(),
};

const Helpers = {};

const injectBuildLog = async (deployment, esClient) => {
  if (!deployment.remoteId) {
    return {
      ...deployment,
      buildLog: null,
    };
  }

  const result = await esClient.search({
    index: 'lagoon-logs-*',
    sort: '@timestamp:desc',
    body: {
      query: {
        bool: {
          must: [
            { match_phrase: { 'meta.remoteId': deployment.remoteId } },
            { match_phrase: { 'meta.buildPhase': deployment.status } },
          ],
        },
      },
    },
  });

  if (!result.hits.total) {
    return {
      ...deployment,
      buildLog: null,
    };
  }

  return {
    ...deployment,
    buildLog: R.path(['hits', 'hits', 0, '_source', 'message'], result),
  };
};

const getDeploymentsByEnvironmentId = ({ sqlClient, esClient }) => async (
  cred,
  eid,
) => {
  const { customers, projects } = cred.permissions;
  const prep = prepare(
    sqlClient,
    `SELECT
        d.*
      FROM environment e
      JOIN deployment d on e.id = d.environment
      JOIN project p ON e.project = p.id
      WHERE e.id = :eid
      ${ifNotAdmin(
    cred.role,
    `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
  )}
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));

  return rows.map(row => injectBuildLog(row, esClient));
};

const getDeploymentByRemoteId = ({ sqlClient, esClient }) => async (
  { role, customers, projects },
  { id },
) => {
  const queryString = knex('deployment')
    .where('remote_id', '=', id)
    .toString();

  const rows = await query(sqlClient, queryString);
  const deployment = R.prop(0, rows);

  if (!deployment) {
    return null;
  }

  if (role !== 'admin') {
    const rowsPerms = await query(
      sqlClient,
      Sql.selectPermsForDeployment(deployment.id),
    );

    if (
      !R.contains(R.path(['0', 'pid'], rowsPerms), projects) &&
      !R.contains(R.path(['0', 'cid'], rowsPerms), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  return injectBuildLog(deployment, esClient);
};

const addDeployment = ({ sqlClient, esClient }) => async (
  { role, customers, projects },
  {
    id, name, status, created, started, completed, environment, remoteId,
  },
) => {
  if (role !== 'admin') {
    const rows = await query(
      sqlClient,
      Sql.selectPermsForEnvironment(environment),
    );

    if (
      !R.contains(R.path(['0', 'pid'], rows), projects) &&
      !R.contains(R.path(['0', 'cid'], rows), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertDeployment({
      id,
      name,
      status,
      created,
      started,
      completed,
      environment,
      remoteId,
    }),
  );

  const rows = await query(sqlClient, Sql.selectDeployment(insertId));

  return injectBuildLog(R.prop(0, rows), esClient);
};

const deleteDeployment = ({ sqlClient }) => async (
  { role, customers, projects },
  { id },
) => {
  if (role !== 'admin') {
    const rows = await query(sqlClient, Sql.selectPermsForDeployment(id));

    if (
      !R.contains(R.path(['0', 'pid'], rows), projects) &&
      !R.contains(R.path(['0', 'cid'], rows), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  await query(sqlClient, Sql.deleteDeployment(id));

  return 'success';
};

const updateDeployment = ({ sqlClient, esClient }) => async (
  { role, customers, projects },
  {
    id,
    patch,
    patch: {
      name, status, created, started, completed, environment, remoteId,
    },
  },
) => {
  if (role !== 'admin') {
    // Check access to modify deployment as it currently stands
    const rowsCurrent = await query(
      sqlClient,
      Sql.selectPermsForDeployment(id),
    );

    if (
      !R.contains(R.path(['0', 'pid'], rowsCurrent), projects) &&
      !R.contains(R.path(['0', 'cid'], rowsCurrent), customers)
    ) {
      throw new Error('Unauthorized.');
    }

    // Check access to modify deployment as it will be updated
    const rowsNew = await query(
      sqlClient,
      Sql.selectPermsForEnvironment(environment),
    );

    if (
      !R.contains(R.path(['0', 'pid'], rowsNew), projects) &&
      !R.contains(R.path(['0', 'cid'], rowsNew), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  await query(
    sqlClient,
    Sql.updateDeployment({
      id,
      patch: {
        name,
        status,
        created,
        started,
        completed,
        environment,
        remoteId,
      },
    }),
  );

  const rows = await query(sqlClient, Sql.selectDeployment(id));

  return injectBuildLog(R.prop(0, rows), esClient);
};


module.exports = {
  Sql,
  Resolvers: {
    getDeploymentsByEnvironmentId,
    getDeploymentByRemoteId,
    addDeployment,
    deleteDeployment,
    updateDeployment,
  },
  Helpers,
};
