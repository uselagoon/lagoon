// @flow

const R = require('ramda');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { createMiscTask } = require('@lagoon/commons/src/tasks');
const { query, isPatchEmpty } = require('../../util/db');
const environmentHelpers = require('../environment/helpers');
const Sql = require('./sql');

/* ::

import type {ResolversObj} from '../';

*/

const getProblemsByEnvironmentId = async (
  { id: environmentId },
  {},
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('problem', 'view', {
    project: environment.project,
  });

  const rows = await query(
    sqlClient,
    Sql.selectProblemsByEnvironmentId(environmentId),
  );

  return  R.sort(R.descend(R.prop('created')), rows);
};


const addProblem = async (
  root,
  {
    input: {
      id, severity, environment: environmentId, identifier, service, source, data, created, severityScore
    },
  },
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('problem', 'add', {
    project: environment.project,
  });

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertProblem({
      id,
      severity,
      severity_score: severityScore,
      lagoon_service: service,
      identifier,
      environment: environmentId,
      source,
      data,
      created,
    }),
  );

  const rows = await query(sqlClient, Sql.selectProblemByDatabaseId(insertId));
  return R.prop(0, rows);
};

const deleteProblem = async (
  root,
  {
    input : {
      environment: environmentId,
      identifier,
    }
  },
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('problem', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteProblem(environmentId, identifier));

  return 'success';
}

const Resolvers /* : ResolversObj */ = {
  getProblemsByEnvironmentId,
  addProblem,
  deleteProblem,
};

module.exports = Resolvers;
