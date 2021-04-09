import * as R from 'ramda';
import { query, prepare } from '../../util/db';
import { Sql } from './sql';
import { Helpers as problemHelpers } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { ResolverFn } from '../';
import { logger } from '../../loggers/logger';


export const getAllProblems: ResolverFn = async (
  root,
  args,
  { sqlClient, hasPermission }
) => {
  let rows = [];

  try {
    if (!R.isEmpty(args)) {
      rows = await problemHelpers(sqlClient).getAllProblems(args.source, args.environment, args.envType, args.severity);
    }
    else {
      rows = await query(sqlClient, Sql.selectAllProblems({source: [], environmentId: 0, environmentType: [], severity: []}));
    }
  }
  catch (err) {
    if (err) {
      logger.warn(err);
      return [];
    }
  }

  const problems: any = rows && rows.map(async problem => {
     const { environment: envId, name, project, environmentType, openshiftProjectName, ...rest} = problem;

      await hasPermission('problem', 'view', {
          project: project,
      });

      return { ...rest, environment: { id: envId, name, project, environmentType, openshiftProjectName }};
  });

  return Promise.all(problems).then((completed) => {
      const sorted = R.sort(R.descend(R.prop('severity')), completed);
      return sorted.map((row: any) => ({ ...(row as Object) }));
  });
};

export const getSeverityOptions = async (
  root,
  args,
  { sqlClient },
) => {
  return await problemHelpers(sqlClient).getSeverityOptions();
};

export const getProblemSources = async (
  root,
  args,
  { sqlClient },
) => {
  const preparedQuery = prepare(
    sqlClient,
    `SELECT DISTINCT source FROM environment_problem`,
  );

  return R.map(
    R.prop('source'),
      await query(sqlClient, preparedQuery(args))
    );
};

export const getProblemsByEnvironmentId = async (
  { id: environmentId },
  {severity, source},
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
      source,
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
  { sqlClient, hasPermission, userActivityLogger },
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
      lagoon_service: service || '',
      identifier,
      environment: environmentId,
      source,
      associated_package: associatedPackage,
      description,
      version: version || '',
      fixed_version: fixedVersion,
      links: links,
      data,
      created,
    }),
  );

  const rows = await query(sqlClient, Sql.selectProblemByDatabaseId(insertId));

  userActivityLogger.user_action(`User added a problem on environment '${environment.name}' for '${environment.project}'`, {
    payload: {
      input: {
        severity,
        severity_score: severityScore,
        lagoon_service: service || '',
        identifier,
        environment: environmentId,
        source,
        associated_package: associatedPackage,
        description,
        version: version || '',
        fixed_version: fixedVersion,
        links: links,
        data,
        created,
      }
    }
  });

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
  { sqlClient, hasPermission, userActivityLogger },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('problem', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteProblem(environmentId, identifier));

  userActivityLogger.user_action(`User deleted a problem on environment '${environment.name}' for '${environment.project}'`, {
    payload: {
      input: { environment, identifier }
    }
  });

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
  { sqlClient, hasPermission, userActivityLogger },
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);

  await hasPermission('problem', 'delete', {
    project: environment.project,
  });

  await query(sqlClient, Sql.deleteProblemsFromSource(environmentId, source, service));

  userActivityLogger.user_action(`User deleted problems on environment '${environment.id}' for source '${source}'`, {
    payload: {
      input: { environment, source, service }
    }
  });

  return 'success';
}

export const getProblemHarborScanMatches = async (
  root,
  args,
  { sqlClient, hasPermission },
) => {

  await hasPermission('harbor_scan_match', 'view', {});

  const rows = await query(
    sqlClient,
    Sql.selectAllProblemHarborScanMatches(),
  );

  return rows;
};

export const addProblemHarborScanMatch = async (
  root,
  {
    input: {
      name,
      description,
      defaultLagoonProject,
      defaultLagoonEnvironment,
      defaultLagoonService,
      regex
    },
  },
  { sqlClient, hasPermission, userActivityLogger },
) => {

  await hasPermission('harbor_scan_match', 'add', {});

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertProblemHarborScanMatch(
      {
        id: null,
        name,
        description,
        default_lagoon_project: defaultLagoonProject,
        default_lagoon_environment: defaultLagoonEnvironment,
        default_lagoon_service_name: defaultLagoonService,
        regex
      }
    ),
  );

  const rows = await query(sqlClient, Sql.selectAllProblemHarborScanMatchByDatabaseId(insertId));

  userActivityLogger.user_action(`User added harbor scan regex matcher`, {
    payload: {
      input: {
        name,
        description,
        defaultLagoonProject,
        defaultLagoonEnvironment,
        defaultLagoonService,
        regex
      }
    }
  });

  return R.prop(0, rows);
};


export const deleteProblemHarborScanMatch = async (
  root,
  {
    input : {
      id
    }
  },
  { sqlClient, hasPermission, userActivityLogger },
) => {

  await hasPermission('harbor_scan_match', 'delete', {});

  await query(sqlClient, Sql.deleteProblemHarborScanMatch(id));

  userActivityLogger.user_action(`User deleted harbor scan regex matcher`, {
    payload: {
      input: { id }
    }
  });

  return 'success';
};
