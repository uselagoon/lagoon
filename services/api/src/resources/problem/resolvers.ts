import * as R from 'ramda';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Helpers as problemHelpers } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { ResolverFn } from '../';
import { logger } from '../../loggers/logger';
import { AuditType } from '@lagoon/commons/dist/types';
import { AuditLog } from '../audit/types';

export const getAllProblems: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  let rows = [];

  try {
    if (!R.isEmpty(args)) {
      rows = await problemHelpers(sqlClientPool).getAllProblems(
        args.source,
        args.environment,
        args.envType,
        args.severity
      );
    } else {
      rows = await query(
        sqlClientPool,
        Sql.selectAllProblems({
          source: [],
          environmentId: 0,
          environmentType: [],
          severity: []
        })
      );
    }
  } catch (err) {
    if (err) {
      logger.warn(`getAllProblems: ${err.message}`);
      return [];
    }
  }

  const problems: any =
    rows &&
    rows.map(async problem => {
      const {
        environment: envId,
        name,
        project,
        environmentType,
        openshiftProjectName,
        ...rest
      } = problem;

      await hasPermission('problem', 'view', {
        project: project
      });

      return {
        ...rest,
        environment: {
          id: envId,
          name,
          project,
          environmentType,
          openshiftProjectName
        }
      };
    });

  return Promise.all(problems).then(completed => {
    const sorted = R.sort(R.descend(R.prop('severity')), completed);
    return sorted.map((row: any) => ({ ...(row as Object) }));
  });
};

export const getSeverityOptions: ResolverFn = async (
  root,
  args,
  { sqlClientPool }
) => {
  return await problemHelpers(sqlClientPool).getSeverityOptions();
};

export const getProblemSources: ResolverFn = async (
  root,
  args,
  { sqlClientPool }
) => {
  return R.map(
    R.prop('source'),
    await query(
      sqlClientPool,
      'SELECT DISTINCT source FROM environment_problem'
    )
  );
};

export const getProblemsByEnvironmentId: ResolverFn = async (
  { id: environmentId },
  { severity, source },
  { sqlClientPool, hasPermission, adminScopes }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    await hasPermission('problem', 'view', {
      project: environment.project
    });
  }

  let rows = await query(
    sqlClientPool,
    Sql.selectProblemsByEnvironmentId({
      environmentId,
      severity,
      source
    })
  );

  //With some changes in Mariadb, we now have to stringify outgoing json
  interface hasData {
    data: string
  }

  rows = R.map((e:hasData) => {
    e.data = JSON.stringify(e.data);
    return e
  }, rows);

  return R.sort(R.descend(R.prop('created')), rows);
};

export const addProblem: ResolverFn = async (
  root,
  {
    input: {
      severity,
      environment: environmentId,
      identifier,
      service,
      source,
      data,
      created,
      severityScore,
      associatedPackage,
      description,
      version,
      fixedVersion,
      links
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger },
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  await hasPermission('problem', 'add', {
    project: environment.project
  });

  let insertId: number;
  try {
     ({insertId} = await query(
      sqlClientPool,
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
        created
      })
    ));
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error adding problem. Problem already exists.`
      );
    } else {
      throw new Error(error.message);
    }
  };

  const rows = await query(
    sqlClientPool,
    Sql.selectProblemByDatabaseId(insertId)
  );

  let project = await projectHelpers(sqlClientPool).getProjectById(environment.project);

  const auditLog: AuditLog = {
    resource: {
      id: project.id.toString(),
      type: AuditType.PROJECT,
      details: project.name,
    },
    linkedResource: {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
  userActivityLogger(`User added a problem to environment '${environment.name}' for '${environment.project}'`, {
    project: '',
    event: 'api:addProblem',
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
        data: JSON.stringify(data),
        created,
      },
      ...auditLog,
    }
  });

  let ret = R.prop(0, rows);
  ret.data = JSON.stringify(data);

  return ret;
};

export const deleteProblem: ResolverFn = async (
  root,
  { input: { environment: environmentId, identifier, service } },
  { sqlClientPool, hasPermission, userActivityLogger  }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  await hasPermission('problem', 'delete', {
    project: environment.project
  });

  let project = await projectHelpers(sqlClientPool).getProjectById(environment.project);

  await query(sqlClientPool, Sql.deleteProblem(environmentId, identifier, service));

  const auditLog: AuditLog = {
    resource: {
      id: project.id.toString(),
      type: AuditType.PROJECT,
      details: project.name,
    },
    linkedResource: {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
  userActivityLogger(`User deleted a problem on environment '${environment.name}' for '${environment.project}'`, {
    project: '',
    event: 'api:deleteProblem',
    payload: {
      input: { environment, identifier },
      ...auditLog,
    }
  });

  return 'success';
};

export const deleteProblemsFromSource: ResolverFn = async (
  root,
  { input: { environment: environmentId, source, service } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);

  await hasPermission('problem', 'delete', {
    project: environment.project
  });

  let project = await projectHelpers(sqlClientPool).getProjectById(environment.project);

  await query(
    sqlClientPool,
    Sql.deleteProblemsFromSource(environmentId, source, service)
  );

  const auditLog: AuditLog = {
    resource: {
      id: project.id.toString(),
      type: AuditType.PROJECT,
      details: project.name,
    },
    linkedResource: {
      id: environment.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
  };
  if (project.organization) {
    auditLog.organizationId = project.organization;
  }
  userActivityLogger(`User deleted problems on environment '${environment.id}' for source '${source}'`, {
    project: '',
    event: 'api:deleteProblemsFromSource',
    payload: {
      input: { environment, source, service },
      ...auditLog,
    }
  });

  return 'success';
};
