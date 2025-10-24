// This file contains the logic to determine whether an environment requires a redeploy

import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createRemoveTask, seedNamespace } from '@lagoon/commons/dist/tasks';
import { ResolverFn } from '..';
import { logger } from '../../loggers/logger';
import { isPatchEmpty, query, knex } from '../../util/db';
import { convertDateToMYSQLDateFormat } from '../../util/convertDateToMYSQLDateTimeFormat';
import { Helpers } from './helpers';
import { Sql } from './sql';
import { Sql as projectSql } from '../project/sql';
import { Helpers as projectHelpers } from '../project/helpers';
import { Helpers as openshiftHelpers } from '../openshift/helpers';
import { Helpers as organizationHelpers } from '../organization/helpers';
import { getFactFilteredEnvironmentIds } from '../fact/resolvers';
import { getUserProjectIdsFromRoleProjectIds } from '../../util/auth';
import { RemoveData, DeployType, AuditType } from '@lagoon/commons/dist/types';
import { AuditLog } from '../audit/types';


export const getPendingChangesByEnvironmentId: ResolverFn = async(
{
    id
},
_,
{ sqlClientPool, hasPermission },
) => {
    // Note: as it stands, the only pending changes we have now have to do
    // with env vars, but anything can be added in the form
    // {type:"string", details:"string"}
    let pendingChanges = await getPendingEnvVarChanges(sqlClientPool, id);
    return pendingChanges;
}

const getPendingEnvVarChanges = async(sqlClientPool, envId) => {
      const sql = `
    SELECT DISTINCT
      ev.name,
      ev.updated,
      e.id,
      e.name as env_name,
	    COALESCE(
	      IF(ev.environment IS NULL,NULL,'Environment'),
	      IF(ev.project IS NULL,NULL,'Project'),
	      IF(ev.organization IS NULL,NULL,'Organization')
      ) as varsource,
      COALESCE(MAX(d.created) OVER (PARTITION BY e.id), '1970-01-01') as last_deployment
    FROM environment as e
    LEFT JOIN deployment as d ON e.id = d.environment
    INNER JOIN project as p ON p.id = e.project
    LEFT JOIN organization as o ON o.id = p.organization
    LEFT JOIN env_vars as ev ON (
      ev.environment = e.id OR
      ev.project = p.id OR
      ev.organization = o.id
    )
    WHERE ev.name IS NOT NULL AND e.id = ?
  `;

  const results = await query(sqlClientPool, sql, [envId]);

  // Filter in memory for env vars updated after last deployment
  const pendingChanges = results.filter(row => {
    const updated = new Date(row.updated);
    const lastDeployment = new Date(row.last_deployment);
    return updated > lastDeployment;
  }).map(row => {
    return {type:`Environment Variable - ${row.varsource} level`, details: row.name};
  });

  return pendingChanges;
}