import * as R from 'ramda';
import { query } from '../../util/db';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Sql } from './sql';
import { ResolverFn } from '../index';
import { knex } from '../../util/db';
import { logger } from '../../loggers/logger';
import crypto from 'crypto';
import { getUserProjectIdsFromRoleProjectIds } from '../../util/auth';

export const getFactsByEnvironmentId: ResolverFn = async (
  { id: environmentId },
  { keyFacts, limit, summary },
  { sqlClientPool, hasPermission, adminScopes }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  if (!adminScopes.projectViewAll) {
    await hasPermission('fact', 'view', {
      project: environment.project
    });
  }


  var rows = [];
  // If we're summarizing facts, we actually can't pass back fact ids, or limit
  if(summary) {
    rows = await query(
      sqlClientPool,
      Sql.selectFactsByEnvironmentId({
        environmentId,
        keyFacts,
        limit: false
      })
    );

    rows = summarizeFacts(rows);

    return R.sort(R.ascend(R.prop('name')), rows);

  } else {
    rows = await query(
      sqlClientPool,
      Sql.selectFactsByEnvironmentId({
        environmentId,
        keyFacts,
        limit
      })
    );

    return R.sort(R.descend(R.prop('created')), rows);
  }

};

const summarizeFacts = (rows) => {
  const factSummary = new Map<string, object>();
  rows.forEach(element => {
    var summaryKey = crypto.createHash('md5')
    .update(element['name'])
    .update(element['value'])
    .update(element['description'])
    .digest('hex');

    //clear identifying marks ...
    element['id'] = null;
    element['created'] = null;

    const summaryConcat = (head, tail) => {
      if(head.length > 0) {
        return `${head}, ${tail}`
      }
      return tail;
    }

    if(factSummary.has(summaryKey)) {
      var f = factSummary.get(summaryKey);
      f['source'] = summaryConcat(f['source'], element['source']);
      //TODO : after adding service, we need to add csv of the service names here ...
      // f['service'] = summaryConcat(f['service'], element['service']);
      factSummary.set(summaryKey, f);
    } else {
      factSummary.set(summaryKey, element);
    }
  });
  return Array.from(factSummary.values());
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
  { sqlClientPool, hasPermission, keycloakGrant, models, keycloakUsersGroups, adminScopes },
  info
) => {

  let userProjectIds: number[];

  if (!adminScopes.projectViewAll) {
    const userProjectRoles = await models.UserModel.getAllProjectsIdsForUser(keycloakGrant.access_token.content.sub, keycloakUsersGroups);
    userProjectIds = getUserProjectIdsFromRoleProjectIds(userProjectRoles);
  }

  const count = await getFactFilteredProjectsCount(input, userProjectIds, sqlClientPool, adminScopes.projectViewAll);
  const rows = await getFactFilteredProjects(input, userProjectIds, sqlClientPool, adminScopes.projectViewAll);

  return { projects: rows, count };
}

export const getEnvironmentsByFactSearch: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, keycloakGrant, models, keycloakUsersGroups, adminScopes }
) => {

  let userProjectIds: number[];
  if (!adminScopes.projectViewAll) {
    const userProjectRoles = await models.UserModel.getAllProjectsIdsForUser(keycloakGrant.access_token.content.sub, keycloakUsersGroups);
    userProjectIds = getUserProjectIdsFromRoleProjectIds(userProjectRoles);
  }

  const count = await getFactFilteredEnvironmentsCount(input, userProjectIds, sqlClientPool, adminScopes.projectViewAll);
  const rows = await getFactFilteredEnvironments(input, userProjectIds, sqlClientPool, adminScopes.projectViewAll);

  return { environments: rows, count };
}

export const processAddFacts = async (facts, sqlClientPool, hasPermission, adminScopes) => {
  const environments = facts.reduce((environmentList, fact) => {
    if (fact.environment == undefined) {
      logger.error(`No environment ID given for fact: ${fact.name}`);
      throw new Error(`No environment ID given for fact: ${fact.name}`);
    }

    let { environment } = fact;
    if (!environmentList.includes(environment)) {
      environmentList.push(environment);
    }
    return environmentList;
  }, []);

  // admin bypass to skip heavy haspermission checks
  if (!adminScopes.projectViewAll) {
    let projectIds = []
    for (let i = 0; i < environments.length; i++) {
      const env = await environmentHelpers(sqlClientPool).getEnvironmentById(
        environments[i]
      );
      // collect the project ids
      projectIds.push(env.project)
    };

    // unique the project ids for more efficient permission checks against projects
    projectIds = [...new Set(projectIds)];

    for (const pid in projectIds) {
      await hasPermission('fact', 'add', {
        project: projectIds[pid]
      });
    }
  }

  const returnFacts = [];
  for (let i = 0; i < facts.length; i++) {
    const { environment, name, value, source, description, type, category, keyFact, service } = facts[i];

    let insertId: number;
    try {
       ({insertId} = await query(
        sqlClientPool,
        Sql.insertFact({
          environment,
          name,
          value,
          source,
          description,
          type,
          keyFact,
          category,
          service
        })
      ));
    } catch(error) {
      throw new Error(
        `Error adding fact. Fact already exists.`
      );
    };

    const rows = await query(sqlClientPool, Sql.selectFactByDatabaseId(insertId));
    returnFacts.push(R.prop(0, rows));
  }
  return returnFacts;
}

export const addFact: ResolverFn = async (
  root,
  { input: { id, environment: environmentId, name, value, source, description, type, category, keyFact, service } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  if (environmentId == undefined) {
    logger.error(`No environment ID given for fact: ${name}`)
    throw new Error(`No environment ID given for fact: ${name}`)
  }

  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  await hasPermission('fact', 'add', {
    project: environment.project
  });

  let insertId: number;
  try {
     ({insertId} = await query(
      sqlClientPool,
      Sql.insertFact({
        environment: environmentId,
        name,
        value,
        source,
        description,
        type,
        keyFact,
        category,
        service
      }),
    ));
  } catch(error) {
    throw new Error(
      `Error adding fact. Fact already exists.`
    );
  };

  const rows = await query(
    sqlClientPool,
    Sql.selectFactByDatabaseId(insertId)
  );

  userActivityLogger(`User added a fact to environment '${environment.name}'`, {
    project: '',
    event: 'api:addFact',
    payload: {
      data: {
        environment: environmentId,
        name,
        value,
        source,
        description,
        service
      }
      }
  });

  return R.prop(0, rows);
};

export const addFacts: ResolverFn = async (
  root,
  { input: { facts } },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  const returnFacts = await processAddFacts(facts, sqlClientPool, hasPermission, adminScopes);

  userActivityLogger(`User added facts to environment'`, {
    project: '',
    event: 'api:addFacts',
    payload: {
      data: {
        returnFacts
      }
    }
  });

  return returnFacts;
};

export const addFactsByName: ResolverFn = async (
  root,
  { input: { project, environment, facts } },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, models, adminScopes }
) => {

  if (!project || !environment) {
    throw new Error("Both 'project' and 'environment' require values"); //Presumably this'll be taken care of via the schema, but let's check either way.
  }

  let lagoonProject = await projectHelpers(sqlClientPool).getProjectIdByName(project);
  if (!adminScopes.projectViewAll) {
    await hasPermission('environment', 'view', {
      project: lagoonProject
    });
  }
  let environments = await environmentHelpers(sqlClientPool).getEnvironmentsByProjectId(lagoonProject);

  if (environments.length == 0) {
    throw new Error(`No environments found for project '${project}'`);
  }

  let envId = R.reduce((acc, e) => {
   return e.name === environment ? e.id : acc;
  }, null, environments);

  if (!envId) {
    throw new Error(`No environment '${environment}' found for project '${project}'`);
  }

  const returnFacts = await processAddFacts(
    R.map((fact:object) => {return {environment: envId, ...fact};}, facts),
    sqlClientPool,
    hasPermission,
    adminScopes,
  );

  userActivityLogger(`User added facts to '${project}:${environment}'`, {
    project: project,
    environment: environment,
    event: 'api:addFactsByName',
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

  userActivityLogger(`User deleted a fact`, {
    project: '',
    event: 'api:deleteFact',
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
  { input: { environment: environmentId, source, service } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  if(environment == null) {
    throw new Error(`Unable to find environment with id: ${environmentId}`);
  }

  await hasPermission('fact', 'delete', {
    project: environment.project
  });

  await query(sqlClientPool, Sql.deleteFactsFromSource(environmentId, source, service));

  userActivityLogger(`User deleted facts`, {
    project: '',
    event: 'api:deleteFactsFromSource',
    payload: {
      data: {
        environment: environmentId,
        source,
        service
      }
    }
  });

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

  let insertId: number;
  try {
     ({insertId} = await query(
      sqlClientPool,
      Sql.insertFactReference({
        fid,
        name
      })
    ));
  } catch(error) {
    throw new Error(
      `Error adding fact reference. Fact reference already exists.`
    );
  };

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


export const getFactFilteredEnvironmentIds = async (filterDetails: any, projectIdSubset: number[], sqlClientPool, isAdmin) => {
  return R.map(p => R.prop("id", p), await getFactFilteredEnvironments(filterDetails, projectIdSubset, sqlClientPool, isAdmin));
};

const getFactFilteredProjects = async (filterDetails: any, projectIdSubset: number[], sqlClientPool, isAdmin: boolean) => {
  let factQuery = knex('project').distinct('project.*').innerJoin('environment', 'environment.project', 'project.id');
  factQuery = buildConditionsForFactSearchQuery(filterDetails, factQuery, projectIdSubset, isAdmin);
  factQuery = setQueryLimit(filterDetails, factQuery);
  factQuery = factQuery.orderBy('project.name', 'asc');

  const rows = await query(sqlClientPool, factQuery.toString());
  return rows;
}

const getFactFilteredProjectsCount = async (filterDetails: any, projectIdSubset: number[], sqlClientPool, isAdmin: boolean) => {
  let factQuery = knex('project').countDistinct({ count: 'project.id'}).innerJoin('environment', 'environment.project', 'project.id');
  factQuery = buildConditionsForFactSearchQuery(filterDetails, factQuery, projectIdSubset, isAdmin);

  const rows = await query(sqlClientPool, factQuery.toString());
  return rows[0].count;
}


const getFactFilteredEnvironments = async (filterDetails: any, projectIdSubset: number[], sqlClientPool, isAdmin: boolean) => {
  let factQuery = knex('environment').distinct('environment.*').innerJoin('project', 'environment.project', 'project.id');
  factQuery = buildConditionsForFactSearchQuery(filterDetails, factQuery, projectIdSubset, isAdmin);
  factQuery = setQueryLimit(filterDetails, factQuery);
  factQuery = factQuery.orderBy('project.name', 'asc');

  const rows = await query(sqlClientPool, factQuery.toString());
  return rows;
}

const getFactFilteredEnvironmentsCount = async (filterDetails: any, projectIdSubset: number[], sqlClientPool, isAdmin: boolean) => {
  let factQuery = knex('environment').countDistinct({ count: 'environment.id'}).innerJoin('project', 'environment.project', 'project.id');
  factQuery = buildConditionsForFactSearchQuery(filterDetails, factQuery, projectIdSubset, isAdmin);

  const rows = await query(sqlClientPool, factQuery.toString());
  return rows[0].count;
}

const buildConditionsForFactSearchQuery = (filterDetails: any, factQuery: any, projectIdSubset: number[], isAdmin: boolean = false, byPassLimits: boolean = false) => {
  if (filterDetails.filters && filterDetails.filters.length > 0) {
    filterDetails.filters.forEach((filter, i) => {

      let { lhsTarget, name } = filter;

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

    const builderFactory = (filter, i) => (builder) => {
      let { lhsTarget, name, contains } = filter;
      if (lhsTarget == "PROJECT") {
        builder = builder.andWhere(`project.${name}`, 'like', `${predicateRHSProcess('CONTAINS', contains)}`);
      } else {
        let tabName = `env${i}`;
        builder = builder.andWhere(`${tabName}.name`, '=', `${name}`);
        builder = builder.andWhere(`${tabName}.value`, 'like', `${predicateRHSProcess('CONTAINS', contains)}`);
      }
      return builder;
    };

    factQuery.andWhere(innerBuilder => {
      filterDetails.filters.forEach((filter, i) => {
        if (filterDetails.filterConnective == 'AND') {
          innerBuilder = innerBuilder.andWhere(builderFactory(filter, i));
        } else {
          innerBuilder = innerBuilder.orWhere(builderFactory(filter, i));
        }
      });
      return innerBuilder;
    })
  }

  if (projectIdSubset && !isAdmin) {
    factQuery = factQuery.andWhere('project', 'IN', projectIdSubset);
  }

  return factQuery;
}

function setQueryLimit(filterDetails: any, factQuery: any) {
  const DEFAULT_RESULTSET_SIZE = 25;

  let { skip = 0, take = DEFAULT_RESULTSET_SIZE } = filterDetails;
  factQuery = factQuery.limit(take).offset(skip);
  return factQuery;
}
