// @flow

import * as R from 'ramda';
import { query } from '../../util/db';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Sql } from './sql';
const userActivityLogger = require('../../loggers/userActivityLogger');

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
      id, environment: environmentId, name, value, source, description
    },
  },
  { sqlClient, hasPermission, keycloakGrant, requestHeaders },
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
      source,
      description
    }),
  );

  const rows = await query(sqlClient, Sql.selectFactByDatabaseId(insertId));

  userActivityLogger.user_action(`User added a fact to environment '${environment.name}'`, {
    user: keycloakGrant,
    headers: requestHeaders,
    payload: {
      data: {
        environment: environmentId,
        name,
        value,
        source,
        description
      }
    }
  });

  return R.prop(0, rows);
};

export const addFacts = async (
  root,
  {
    input: {
      facts
    }
  },
  { sqlClient, hasPermission, keycloakGrant, requestHeaders }
) => {

  // We first check that the user has access to all of the environments, so this is an atomic operation.
  await facts.map(async (fact) => {
    const { environment } = fact;
    const env = await environmentHelpers(sqlClient).getEnvironmentById(environment);

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

    userActivityLogger.user_action(`User added facts to environments'`, {
      user: keycloakGrant,
      headers: requestHeaders,
      payload: {
        data: {
          facts
        }
      }
    });

    return R.prop(0, rows);
  });
};

export const deleteFact = async (
  root,
  {
    input : {
      environment: environmentId,
      name,
    }
  },
  { sqlClient, hasPermission, keycloakGrant, requestHeaders },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteFact(environmentId, name));

  userActivityLogger.user_action(`User deleted a fact`, {
    user: keycloakGrant,
    headers: requestHeaders,
    payload: {
      data: {
        environment: environmentId,
        name
      }
    }
  });

  return 'success';
};

export const deleteFactsFromSource = async (
  root,
  {
    input : {
     environment: environmentId,
     source,
    }
  },
  { sqlClient, hasPermission, keycloakGrant, requestHeaders },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteFactsFromSource(environmentId, source));

  userActivityLogger.user_action(`User deleted facts`, {
    user: keycloakGrant,
    headers: requestHeaders,
    payload: {
      data: {
        environment: environmentId,
        source
      }
    }
  });

  return 'success';
};
