import * as R from 'ramda';
import { query } from '../../util/db';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Sql } from './sql';
import { ResolverFn } from '../index';
import { knex } from '../../util/db';
import logger from '../../logger';

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

const predicateRHSProcess = (predicate, targetValue) => predicate == 'CONTAINS' ? `%${targetValue}%` : targetValue

const getSqlPredicate = (predicate) => {
  const predicateMap = {
    'CONTAINS': 'like',
    'LESS_THAN': '<',
    'LESS_THAN_OR_EQUALS': '<=',
    'GREATER_THAN': '>',
    'GREATER_THAN_OR_EQUALS': '<=',
    'EQUALS': '=',
  };

  return predicateMap[predicate];
}

export const getProjectsByFactSearch: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, keycloakGrant, models }
) => {

  let isAdmin = false;
  let userProjectIds: number[];
  try {
    await hasPermission('project', 'viewAll');
    isAdmin = true;
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getAllProjects');
      return [];
    }

    userProjectIds = await models.UserModel.getAllProjectsIdsForUser({
      id: keycloakGrant.access_token.content.sub
    });
  }

  return await getFactFilteredProjects(input, userProjectIds, sqlClientPool, isAdmin);
}

export const getEnvironmentsByFactSearch: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, keycloakGrant, models }
) => {

  let userProjectIds: number[];
  try {
    await hasPermission('project', 'viewAll');
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getAllProjects');
      return [];
    }

    userProjectIds = await models.UserModel.getAllProjectsIdsForUser({
      id: keycloakGrant.access_token.content.sub
    });
  }

  return await getFactFilteredEnvironments(input, userProjectIds, sqlClientPool);
}

export const addFact: ResolverFn = async (
  root,
  {
    input: {
      id, environment: environmentId, name, value, source, description, type, category, reference
    },
  },
  { sqlClientPool, hasPermission },
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
      description,
      type,
      reference,
      category
    }),
  );

  const rows = await query(
    sqlClientPool,
    Sql.selectFactByDatabaseId(insertId)
  );

  return R.prop(0, rows);
};

export const addFacts: ResolverFn = async (
  root,
  { input: { facts } },
  { sqlClientPool, hasPermission }
) => {
  // We first check that the user has access to all of the environments, so this is an atomic operation.
  await facts.map(async fact => {
    const { environment } = fact;
    const env = await environmentHelpers(sqlClientPool).getEnvironmentById(
      environment
    );

    await hasPermission('fact', 'add', {
      project: env.project
    });
  });

  return await facts.map(async (fact) => {
    const { environment, name, value, source, description, type, category, reference } = fact;

    const { insertId } = await query(
      sqlClientPool,
      Sql.insertFact({
        environment,
        name,
        value,
        source,
        description,
        type,
        reference,
        category
      }),
    );

    const rows = await query(
      sqlClientPool,
      Sql.selectFactByDatabaseId(insertId)
    );
    return R.prop(0, rows);
  });
};

export const deleteFact: ResolverFn = async (
  root,
  { input: { environment: environmentId, name } },
  { sqlClientPool, hasPermission }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project
  });

  await query(sqlClientPool, Sql.deleteFact(environmentId, name));

  return 'success';
};

export const deleteFactsFromSource: ResolverFn = async (
  root,
  { input: { environment: environmentId, source } },
  { sqlClientPool, hasPermission }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  await hasPermission('fact', 'delete', {
    project: environment.project
  });

  await query(sqlClientPool, Sql.deleteFactsFromSource(environmentId, source));

  return 'success';
};

export const getFactFilteredEnvironmentIds = async (filterDetails: any, projectIdSubset: number[], sqlClientPool) => {
  return R.map(p => R.prop("id", p), await getFactFilteredEnvironments(filterDetails, projectIdSubset, sqlClientPool));
};

const getFactFilteredProjects = async (filterDetails: any, projectIdSubset: number[], sqlClientPool, isAdmin: boolean) => {
  let factQuery = knex('project').distinct('project.*').innerJoin('environment', 'environment.project', 'project.id');
  factQuery = buildContitionsForFactSearchQuery(filterDetails, factQuery, projectIdSubset, isAdmin);
  const rows = await query(sqlClientPool, factQuery.toString());
  return rows;
}

const getFactFilteredEnvironments = async (filterDetails: any, projectIdSubset: number[], sqlClientPool) => {
  let factQuery = knex('environment').distinct('environment.*').innerJoin('project', 'environment.project', 'project.id');
  factQuery = buildContitionsForFactSearchQuery(filterDetails, factQuery, projectIdSubset);
  const rows = await query(sqlClientPool, factQuery.toString());
  return rows;
}

const buildContitionsForFactSearchQuery = (filterDetails: any, factQuery: any, projectIdSubset: number[], isAdmin: boolean = false) => {
  const filters = {};

  // if (!filterDetails.filters) throw Error(`No filters given in factFilter`);

  if (filterDetails.filters && filterDetails.filters.length > 0) {
    filterDetails.filters.forEach((e, i) => {

      let { lhsTarget, name } = e;

      let tabName = `env${i}`;
      if (lhsTarget == "project") {
        switch (name) {
          case ("id"):
            break;
          case ("name"):
            break;
          default:
            throw Error(`lhsTarget "${name}" unsupported`);
        }
      } else {
        if (filterDetails.filterConnective == 'AND') {
          factQuery = factQuery.innerJoin(`environment_fact as ${tabName}`, 'environment.id', `${tabName}.environment`);
        } else {
          factQuery = factQuery.leftJoin(`environment_fact as ${tabName}`, 'environment.id', `${tabName}.environment`);
        }
      }
    });

    const builderFactory = (e, i) => (builder) => {
      let { lhsTarget, lhs } = e;
      if (lhsTarget == "PROJECT") {
        builder = builder.andWhere(`${lhsTarget}.${lhs}`, getSqlPredicate(e.predicate), predicateRHSProcess(e.predicate, e.rhs));
      } else {
        let tabName = `env${i}`;
        builder = builder.andWhere(`${tabName}.name`, '=', `${e.name}`);
        builder = builder.andWhere(`${tabName}.value`, 'like', `%${e.contains}%`);
      }
      return builder;
    };

    factQuery.andWhere(innerBuilder => {
      filterDetails.filters.forEach((e, i) => {
        if (filterDetails.filterConnective == 'AND') {
          innerBuilder = innerBuilder.andWhere(builderFactory(e, i));
        } else {
          innerBuilder = innerBuilder.orWhere(builderFactory(e, i));
        }
      });
      return innerBuilder;
    })
  }
  else {
    if (!isAdmin) {
      factQuery = factQuery.innerJoin(`environment_fact`, 'environment.id', `environment_fact.environment`);
    }
  }

  if (projectIdSubset && !isAdmin) {
    factQuery = factQuery.andWhere('project', 'IN', projectIdSubset);
  }
  const DEFAULT_RESULTSET_SIZE = 25;

  //skip and take logic
  let { skip = 0, take = DEFAULT_RESULTSET_SIZE } = filterDetails;
  factQuery = factQuery.limit(take).offset(skip);

  return factQuery;
}
