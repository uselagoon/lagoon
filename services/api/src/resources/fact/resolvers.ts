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

export const getFactsByEnvironmentId = async (
  { id: environmentId },
  {severity},
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('fact', 'view', {
    project: environment.project,
  });

  const rows = await query(
    sqlClient,
    Sql.selectFactsByEnvironmentId({
      environmentId,
    }),
  );

  return  R.sort(R.descend(R.prop('created')), rows);
};

export const addFact = async (
  root,
  {
    input: {
      id, environment: environmentId, name, value
    },
  },
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);


  await hasPermission('fact', 'add', {
    project: environment.project,
  });

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertFact({
        environment: environmentId,
        name,
        value,
    }),
  );

  const rows = await query(sqlClient, Sql.selectFactByDatabaseId(insertId));
  return R.prop(0, rows);
};

export const deleteFact = async (
  root,
  {
    input : {
      environment: environmentId,
      name,
    }
  },
  { sqlClient, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteFact(environmentId, name));

  return 'success';
};
