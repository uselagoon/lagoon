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
WITH last_completed AS (
  SELECT COALESCE(MAX(d.created), TIMESTAMP('1970-01-01 00:00:00')) AS ts
  FROM deployment d
  WHERE d.environment = ? AND d.status = 'complete'
)
SELECT *
FROM (
  -- Environment-scoped
  SELECT
    e.id   AS env_id,
    e.name AS env_name,
    ev.name AS envvar_name,
    ev.updated AS envvar_updated,
    'Environment' AS envvar_source
  FROM environment e
  JOIN env_vars ev ON ev.environment = e.id
  CROSS JOIN last_completed lc
  WHERE e.id = ?
    AND ev.name IS NOT NULL
    AND ev.updated > lc.ts

  UNION ALL

  -- Project-scoped
  SELECT
    e.id, e.name,
    ev.name, ev.updated,
    'Project' AS envvar_source
  FROM environment e
  JOIN project p   ON p.id = e.project
  JOIN env_vars ev ON ev.project = p.id
  CROSS JOIN last_completed lc
  WHERE e.id = ?
    AND ev.name IS NOT NULL
    AND ev.updated > lc.ts

  UNION ALL

  -- Organization-scoped
  SELECT
    e.id, e.name,
    ev.name, ev.updated,
    'Organization' AS envvar_source
  FROM environment e
  JOIN project p        ON p.id = e.project
  JOIN organization o   ON o.id = p.organization
  JOIN env_vars ev      ON ev.organization = o.id
  CROSS JOIN last_completed lc
  WHERE e.id = ?
    AND ev.name IS NOT NULL
    AND ev.updated > lc.ts
) AS allenvs
ORDER BY allenvs.envvar_updated DESC;
`;

  const results = await query(sqlClientPool, sql, [envId, envId, envId, envId]);

  const pendingChanges = results.map(row => {
    return {type:`Environment Variable - ${row.envvarSource} level`, details: row.envvarName, date: row.envvarUpdated};
  });

  return pendingChanges;
}