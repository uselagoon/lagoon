import * as R from 'ramda';
import { query } from '../../util/db';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Sql } from './sql';
import { ResolverFn } from '../index';

export const getFactsByEnvironmentId: ResolverFn = async (
  { id: environmentId },
  args,
  { sqlClientPool, hasPermission }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  await hasPermission('fact', 'view', {
    project: environment.project
  });

  const rows = await query(
    sqlClientPool,
    Sql.selectFactsByEnvironmentId({
      environmentId
    })
  );

  return R.sort(R.descend(R.prop('created')), rows);
};

export const addFact: ResolverFn = async (
  root,
  { input: { environment: environmentId, name, value, source, description } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  await hasPermission('fact', 'add', {
    project: environment.project
  });

  const { insertId } = await query(
    sqlClientPool,
    Sql.insertFact({
      environment: environmentId,
      name,
      value,
      source,
      description
    })
  );

  const rows = await query(sqlClientPool, Sql.selectFactByDatabaseId(insertId));

  userActivityLogger.user_action(`User added a fact to environment '${environment.name}'`, {
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

export const addFacts: ResolverFn = async (
  root,
  { input: { facts } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {

  const environments = facts.reduce((environmentList, fact) => {
    let { environment } = fact;
    if (!environmentList.includes(environment)) {
      environmentList.push(environment);
    }
    return environmentList;
  }, []);

  for (let i = 0; i < environments.length; i++) {
    const env = await environmentHelpers(sqlClientPool).getEnvironmentById(
      environments[i]
    );
    await hasPermission('fact', 'add', {
      project: env.project
    });
  }

  const returnFacts = [];
  for (let i = 0; i < facts.length; i++) {
    const { environment, name, value, source, description } = facts[i];
    const {
      insertId
    } = await query(
      sqlClientPool,
      Sql.insertFact({
        environment,
        name,
        value,
        source,
        description
      })
    );

    const rows =  await query(sqlClientPool, Sql.selectFactByDatabaseId(insertId));
    returnFacts.push(R.prop(0, rows));
  }

  userActivityLogger.user_action(`User added facts to environments'`, {
    payload: {
      data: {
        returnFacts
      }
    }
  });

  return returnFacts;
};

export const deleteFact: ResolverFn = async (
  root,
  { input: { environment: environmentId, name } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project
  });

  await query(sqlClientPool, Sql.deleteFact(environmentId, name));

  userActivityLogger.user_action(`User deleted a fact`, {
    payload: {
      data: {
        environment: environmentId,
        name
      }
    }
  });

  return 'success';
};

export const deleteFactsFromSource: ResolverFn = async (
  root,
  { input: { environment: environmentId, source } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project
  });

  await query(sqlClientPool, Sql.deleteFactsFromSource(environmentId, source));

  userActivityLogger.user_action(`User deleted facts`, {
    payload: {
      data: {
        environment: environmentId,
        source
      }
    }
  });

  return 'success';
};
