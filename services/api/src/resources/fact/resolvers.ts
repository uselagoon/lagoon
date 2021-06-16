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

export const getFactReferencesByFactId: ResolverFn = async (
  { id: fid },
  args,
  { sqlClientPool }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectFactReferencesByFactId(fid)
  );

  return R.sort(R.descend(R.prop('name')), rows);
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
      id, environment: environmentId, name, value, source, description, type, category, keyFact
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
      keyFact,
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
  };

  const returnFacts = [];
  for (let i = 0; i < facts.length; i++) {
    const { environment, name, value, source, description, type, category, keyFact } = facts[i];
    const {
      insertId
    } = await query(
      sqlClientPool,
      Sql.insertFact({
        environment,
        name,
        value,
        source,
        description,
        type,
        keyFact,
        category
      }),
    );

    const rows =  await query(sqlClientPool, Sql.selectFactByDatabaseId(insertId));
    returnFacts.push(R.prop(0, rows));
  }

  return returnFacts;
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

export const addFactReference: ResolverFn = async (
  root,
  { input: { fid, name } },
  { sqlClientPool, hasPermission }
) => {

  const fact = await query(sqlClientPool, Sql.selectFactByDatabaseId(fid));

  if (!R.prop(0, fact)) {
    throw new Error('No fact could be found with that ID');
  }

  const environment = await environmentHelpers(sqlClientPool).getEnvironmentById((R.prop(0, fact)).environment);

  await hasPermission('fact', 'add', {
    project: environment.project
  });

  const { insertId } = await query(
    sqlClientPool,
    Sql.insertFactReference({
      fid,
      name
    })
  );

  const rows = await query(
    sqlClientPool,
    Sql.selectFactReferenceByDatabaseId(insertId)
  );

  return R.prop(0, rows);
};

export const deleteFactReference: ResolverFn = async (
  root,
  { input: { factName, referenceName, eid } },
  { sqlClientPool, hasPermission }
) => {

  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(eid);

  await hasPermission('fact', 'delete', {
    project: environment.project
  });

  await query(
    sqlClientPool,
    `DELETE r FROM environment_fact_reference as r
     WHERE r.name = :r_name
     AND r.fid IN (
      SELECT f.id FROM environment_fact as f WHERE f.environment = :eid AND f.name = :f_name
     )`,
    {
      fName: factName,
      rName: referenceName,
      eid
    }
  );

  return 'success';
};

export const deleteAllFactReferencesByFactId: ResolverFn = async (
  root,
  { input: { fid } },
  { sqlClientPool, hasPermission }
) => {
  const fact = await query(
    sqlClientPool,
    Sql.selectFactByDatabaseId(fid)
  );

  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(R.prop(0, fact).environment);

  await hasPermission('fact', 'delete', {
    project: environment.project
  });

  const { affectedRows } = await query(sqlClientPool, Sql.deleteFactReferencesByFactId(fid));
  if (affectedRows === 0) {
    throw new Error('Fact reference ID could not be found');
  }
  return `Success: ${affectedRows} fact reference/s deleted`;
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
