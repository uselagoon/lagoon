// @flow

const R = require('ramda');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { createMiscTask } = require('@lagoon/commons/src/tasks');
const { knex, query, isPatchEmpty } = require('../../util/db');
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
      id, severity, environment: environmentId, identifier, service, source, data, created,
        severityScore, associatedPackage, description, version, fixedVersion, links
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
      associated_package: associatedPackage,
      description,
      version,
      fixed_version: fixedVersion,
      links: links,
      data,
      created,
    }),
  );

  const rows = await query(sqlClient, Sql.selectProblemByDatabaseId(insertId));
  return R.prop(0, rows);
};

/**
 * Essentially this is a bulk insert
 */
const addProblemsFromSource = async(
  root,
  {
    input: {
      environment: environmentId,
      source,
      problems,
    }
  },
  { sqlClient, hasPermission }
  ) => {
    const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

    await hasPermission('problem', 'add', {
      project: environment.project,
    });

    //NOTE: this actually works - let's move it into a transaction ...
     const Promises = problems.map(element => query(
        sqlClient,
        Sql.insertProblem({
          severity: element.severity,
          severity_score: element.severityScore,
          identifier: element.identifier,
          environment: environmentId,
          source,
          data: element.data,
        })
      ));

      let rets = [];
      //TODO: use Rambda to pull these props off - build some kind of fallback logic for errors ...
      await Promise.all(Promises).then(values => rets = values.map(e => e.info.insertId));
      // return rets;
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
};

const deleteProblemsFromSource = async (
  root,
  {
    input : {
      environment: environmentId,
      source,
      service,
    }
  },
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('problem', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteProblemsFromSource(environmentId, source, service));

  return 'success';
}

const Resolvers /* : ResolversObj */ = {
  getProblemsByEnvironmentId,
  addProblem,
  deleteProblem,
  deleteProblemsFromSource,
  addProblemsFromSource,
};

module.exports = Resolvers;
