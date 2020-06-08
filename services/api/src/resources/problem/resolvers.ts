// @flow

import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/src/logs';
import { createMiscTask } from '@lagoon/commons/src/tasks';
import { knex, query, isPatchEmpty } from '../../util/db';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Sql } from './sql';

/* ::

import type {ResolversObj} from '../';

*/

export const getProblemsByEnvironmentId = async (
  { id: environmentId },
  {severity},
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('problem', 'view', {
    project: environment.project,
  });

  const rows = await query(
    sqlClient,
    Sql.selectProblemsByEnvironmentId({
      environmentId,
      severity,
    }),
  );

  return  R.sort(R.descend(R.prop('created')), rows);
};

export const addProblem = async (
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

export const deleteProblem = async (
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

export const deleteProblemsFromSource = async (
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
