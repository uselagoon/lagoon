// @flow

import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/src/logs';
import { createMiscTask } from '@lagoon/commons/src/tasks';
import { knex, query, isPatchEmpty } from '../../util/db';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Sql } from './sql';
import validator from 'validator';
import {ResolverFn} from "../index";
import {Helpers} from "../task/helpers";
import {pubSub} from "../../clients/pubSub";
import EVENTS from "../task/events";

/* ::

import type {ResolversObj} from '../';

*/

export const getFactsByEnvironmentId: ResolverFn = async (
  { id: environmentId },
  {severity},
  { sqlClient, sqlClientPool, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClientPool).getEnvironmentById(environmentId);

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

export const addFact: ResolverFn = async (
  root,
  {
    input: {
      id, environment: environmentId, name, value, source, description
    },
  },
  { sqlClient, sqlClientPool, hasPermission },
) => {

  const environment = await environmentHelpers(sqlClientPool).getEnvironmentById(environmentId);

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
      source,
      description
    }),
  );

  const rows = await query(sqlClient, Sql.selectFactByDatabaseId(insertId));
  return R.prop(0, rows);
};

export const addFacts: ResolverFn = async (
  root,
  {
    input: {
      facts
    }
  },
  { sqlClient, sqlClientPool, hasPermission }
) => {

  // We first check that the user has access to all of the environments, so this is an atomic operation.
  await facts.map(async (fact) => {
    const { environment } = fact;
    const env = await environmentHelpers(sqlClientPool).getEnvironmentById(environment);

    await hasPermission('fact', 'add', {
      project: env.project,
    });
  });

  return await facts.map(async (fact) => {
    const { environment, name, value, source, description } = fact;

    const {
      info: { insertId },
    } = await query(
      sqlClient,
      Sql.insertFact({
        environment,
        name,
        value,
        source,
        description
      }),
    );

    const rows =  await query(sqlClient, Sql.selectFactByDatabaseId(insertId));
    return R.prop(0, rows);
  });
};

export const deleteFact: ResolverFn = async (
  root,
  {
    input : {
      environment: environmentId,
      name,
    }
  },
  { sqlClient, sqlClientPool, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClientPool).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteFact(environmentId, name));

  return 'success';
};

export const deleteFactsFromSource: ResolverFn = async (
  root,
  {
    input : {
     environment: environmentId,
     source,
    }
  },
  { sqlClient, sqlClientPool, hasPermission },
) => {
  const environment = await environmentHelpers(sqlClientPool).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteFactsFromSource(environmentId, source));

  return 'success';
};
