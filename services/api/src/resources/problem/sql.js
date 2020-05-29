// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const standardEnvironmentReturn = {
    id: 'id',
    environment: 'environment',
    severity: 'severity',
    severityScore: 'severity_score',
    identifier: 'identifier',
    service: 'lagoon_service',
    source: 'source',
    associatedPackage: 'associated_package',
    description: 'description',
    version: 'version',
    fixedVersion: 'fixed_version',
    links: 'links',
    data: 'data',
    created: 'created',
    deleted: 'deleted'
};

const Sql /* : SqlObj */ = {
  selectAllProblems: ({
    source = [],
    environmentId,
    severity = [],
  }) => {
    let q = knex('environment_problem').select(standardEnvironmentReturn)
    .where('deleted', '=', '0000-00-00 00:00:00');
    if (source.length > 0) {
      q.whereIn('source', source);
    }
    if (environmentId) {
      q.where('environment', environmentId);
    }
    if (severity.length > 0) {
      q.whereIn('severity', severity);
    }
    return q.toString();
  },
  selectProblemByDatabaseId: (id) =>
    knex('environment_problem').where('id', id).toString(),
  selectProblemsByEnvironmentId: (environmentId) =>
    knex('environment_problem').select(standardEnvironmentReturn)
    .where('environment', environmentId)
    .where('deleted', '=', '0000-00-00 00:00:00')
    .toString(),
  insertProblem: ({id, environment, severity, severity_score, identifier, lagoon_service, source,
                      associated_package, description, version, fixed_version, links, data, created}) =>
    knex('environment_problem').insert({id, environment, severity, severity_score, identifier, lagoon_service, source,
        associated_package, description, version, fixed_version, links, data, created}).toString(),
  deleteProblem: (environment, identifier) =>
    knex('environment_problem')
      .where({
        environment: environment,
        identifier: identifier
      })
      .where('deleted', '=', '0000-00-00 00:00:00')
      .update({ deleted: knex.fn.now() })
      .toString(),
  deleteProblemsFromSource: (environment, source) =>
      knex('environment_problem')
        .where({
          environment: environment,
          source: source
        })
        .where('deleted', '=', '0000-00-00 00:00:00')
        .update({ deleted: knex.fn.now() })
        .toString(),
};

module.exports = Sql;
