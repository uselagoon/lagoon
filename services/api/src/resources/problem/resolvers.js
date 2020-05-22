// @flow

const R = require('ramda');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { createMiscTask } = require('@lagoon/commons/src/tasks');
const environmentHelpers = require('../environment/helpers');
const Sql = require('./sql');
const {
    knex,
    inClause,
    prepare,
    query,
    whereAnd,
    isPatchEmpty,
} = require('../../util/db');

/* ::

import type {ResolversObj} from '../';

*/

const getAllProblems = async (
    root,
    args,
    {
        sqlClient,
        hasPermission,
        keycloakGrant,
    }
) => {

    let where;
    try {
        //@TODO: Create a permission for viewing problems.
        await hasPermission('project', 'viewAll');

        where = whereAnd([
            args.createdAfter ? 'created >= :created_after' : '',
        ]);
    } catch (err) {
        if (!keycloakGrant) {
            logger.warn('No grant available for getAllProblems');
            return [];
        }
    }

    const order = args.order ? ` ORDER BY ${R.toLower(args.order)} ASC` : '';

    let rows = [];
    if (!R.isEmpty(args.environment)) {
        rows = await query(
            sqlClient,
            Sql.selectProblemsByEnvironmentId(args.environment),
        );
    }
    else {
        // if (!R.isEmpty(args.type)) {
        //     where = whereAnd([
        //         args.type ? 'environment_type = :type' : '',
        //     ]);
        // }
        const prep = prepare(sqlClient, `SELECT * FROM environment_problem ${where}${order}`);
        rows = await query(sqlClient, prep(args));
    }

    return rows.map(row => ({ environmentId: row.environment, ...row }));
};

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
    }
  },
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('problem', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteProblemsFromSource(environmentId, source));

  return 'success';
};

const Resolvers /* : ResolversObj */ = {
  getAllProblems,
  getProblemsByEnvironmentId,
  addProblem,
  deleteProblem,
  deleteProblemsFromSource,
  addProblemsFromSource,
};

module.exports = Resolvers;
