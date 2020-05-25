// @flow

import {useQuery} from "@apollo/react-hooks";
import moment from "moment";

const R = require('ramda');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { createMiscTask } = require('@lagoon/commons/src/tasks');
const environmentHelpers = require('../environment/helpers');
const Sql = require('./sql');
const projectSql = require('../project/sql');
const projectHelpers = require('../project/helpers');

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
console.log('args: ', args);

  let where;
  try {
    //@TODO: Define a permission for this specific case.
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

    if (!R.isEmpty(args) && (!R.isEmpty(args.environment) || !R.isEmpty(args.severity))) {
      rows = await query(
        sqlClient,
        Sql.selectAllProblems({
          environmentId: args.environment,
          severity: args.severity,
        })
      );
    }
    else {
      const prep = prepare(sqlClient, `SELECT * FROM environment_problem ${where}${order}`);
      rows = await query(sqlClient, prep(args));
    }

    let groupByProblemId = rows.reduce(function (obj, problem) {
        obj[problem.identifier] = obj[problem.identifier] || [];
        obj[problem.identifier].push(problem);
        return obj;
    }, {});

    let problems = Object.keys(groupByProblemId).map(async (key) => {

        let projects = [];
        let problem = groupByProblemId[key];
        problem.map(async (problem) => {
            let p = await projects.push(projectHelpers(sqlClient).getProjectByEnvironmentId(problem.environment));
            return !R.isEmpty(p);
        });

            return {identifier: key, ...problem, projects: await Promise.all(projects), problems: await groupByProblemId[key]};
    });

    const withProjects = await Promise.all(problems);

    const sorted = R.sort(R.descend(R.prop('identifier')), withProjects);
    return sorted.map(row => ({ environmentId: row.environment, ...row }));
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
