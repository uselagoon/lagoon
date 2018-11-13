// @flow

const R = require('ramda');
const esClient = require('../../clients/esClient');
const sqlClient = require('../../clients/sqlClient');
const {
  knex,
  ifNotAdmin,
  inClauseOr,
  prepare,
  query,
  isPatchEmpty,
} = require('../../util/db');
const Sql = require('./sql');

/* ::

import type {ResolversObj} from '../';

*/

const deploymentStatusTypeToString = R.cond([
  [R.equals('NEW'), R.toLower],
  [R.equals('PENDING'), R.toLower],
  [R.equals('RUNNING'), R.toLower],
  [R.equals('CANCELLED'), R.toLower],
  [R.equals('ERROR'), R.toLower],
  [R.equals('FAILED'), R.toLower],
  [R.equals('COMPLETE'), R.toLower],
  [R.T, R.identity],
]);

const injectBuildLog = async deployment => {
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

const getDeploymentsByEnvironmentId = async (
  { id: eid },
  { name },
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
        d.*
      FROM environment e
      JOIN deployment d on e.id = d.environment
      JOIN project p ON e.project = p.id
      WHERE e.id = :eid
      ${ifNotAdmin(
    role,
    `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
  )}
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));

  return rows.filter(row => {
    if (R.isNil(name) || R.isEmpty(name)) {
      return true;
    }

    return row.name === name;
  }).map(row => injectBuildLog(row));
};

const getDeploymentByRemoteId = async (
  root,
  { id },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
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

  return injectBuildLog(deployment);
};

const addDeployment = async (
  root,
  {
    input: {
      id,
      name,
      status: unformattedStatus,
      created,
      started,
      completed,
      environment,
      remoteId,
    },
  },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const status = deploymentStatusTypeToString(unformattedStatus);

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

  return injectBuildLog(R.prop(0, rows));
};

const deleteDeployment = async (
  root,
  { input: { id } },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
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

const updateDeployment = async (
  root,
  {
    input: {
      id,
      patch,
      patch: {
        name,
        status: unformattedStatus,
        created,
        started,
        completed,
        environment,
        remoteId,
      },
    },
  },
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const status = deploymentStatusTypeToString(unformattedStatus);

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

  return injectBuildLog(R.prop(0, rows));
};

const Resolvers /* : ResolversObj */ = {
  getDeploymentsByEnvironmentId,
  getDeploymentByRemoteId,
  addDeployment,
  deleteDeployment,
  updateDeployment,
};

module.exports = Resolvers;
