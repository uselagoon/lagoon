// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const standardEnvironmentReturn = {id: 'id',
environment: 'environment',
severity: 'severity',
severityScore: 'severity_score',
identifier: 'identifier',
service: 'lagoon_service',
source: 'source',
data: 'data',
created: 'created',
deleted: 'deleted'
};

const Sql /* : SqlObj */ = {
  selectAllProblems: () =>
    knex('environment_problem')
    .select(standardEnvironmentReturn).toString(),
  selectProblemByDatabaseId: (id) =>
    knex('environment_problem').where('id', id).toString(),
  selectProblemsByEnvironmentId: (environmentId) =>
    knex('environment_problem').select(standardEnvironmentReturn)
    .where('environment', environmentId)
    .where('deleted', '=', '0000-00-00 00:00:00')
    .toString(),
  insertProblem: ({id, environment, severity, severity_score, identifier, lagoon_service, source, data, created}) =>
    knex('environment_problem').insert({id, environment, severity, severity_score, identifier, lagoon_service, source, data, created}).toString(),
  deleteProblem: (environment, identifier) =>
    knex('environment_problem')
      .where({
        environment: environment,
        identifier: identifier
      })
      .where('deleted', '=', '0000-00-00 00:00:00')
      .update({ deleted: knex.fn.now() })
      .toString(),
};

module.exports = Sql;
