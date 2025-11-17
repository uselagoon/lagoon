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


export const environmentPendingChangeTypes = {
  ENVVAR: "ENVVAR",
};

export const getPendingChangesByEnvironmentId: ResolverFn = async(
{
    id
},
_,
{ sqlClientPool, hasPermission },
) => {
    // Note: as it stands, the only pending changes we have now have to do
    // with env vars, but anything can be added in the form
    // {type:"string", details:"string", date: "string"}
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
    lc.ts as env_last_updated,
    IF(ev.updated > lc.ts, "deploy", "no-deploy") as must_deploy,
    'Environment' AS envvar_source,
    3 as envvar_priority
  FROM environment e
  JOIN env_vars ev ON ev.environment = e.id
  CROSS JOIN last_completed lc
  WHERE e.id = ?
    AND ev.name IS NOT NULL

  UNION ALL

  -- Project-scoped
  SELECT
    e.id, e.name,
    ev.name AS envvar_name,
    ev.updated AS envvar_updated,
    lc.ts as env_last_updated,
    IF(ev.updated > lc.ts, "deploy", "no-deploy") as must_deploy,
    'Project' AS envvar_source,
    2 as envvar_priority
  FROM environment e
  JOIN project p   ON p.id = e.project
  JOIN env_vars ev ON ev.project = p.id
  CROSS JOIN last_completed lc
  WHERE e.id = ?
    AND ev.name IS NOT NULL

  UNION ALL

  -- Organization-scoped
  SELECT
    e.id, e.name,
    ev.name AS envvar_name,
    ev.updated AS envvar_updated,
    lc.ts as env_last_updated,
    IF(ev.updated > lc.ts, "deploy", "no-deploy") as must_deploy,
    'Organization' AS envvar_source,
    1 as envvar_priority
  FROM environment e
  JOIN project p        ON p.id = e.project
  JOIN organization o   ON o.id = p.organization
  JOIN env_vars ev      ON ev.organization = o.id
  CROSS JOIN last_completed lc
  WHERE e.id = ?
    AND ev.name IS NOT NULL

) AS allenvs
ORDER BY allenvs.envvar_priority ASC;
`;

  const results = await query(sqlClientPool, sql, [envId, envId, envId, envId]);

let overrideMap = new Map()

results.forEach((row) => {
    if (overrideMap.has(row.envvarName)) { // Check if there is already an instance of this var
        let other = overrideMap.get(row.envvarName)
        if(row.envvarPriority > other.envvarPriority) { // if this is higher
            if(row.mustDeploy === "deploy") {
                // We override conventionally
                overrideMap.set(row.envvarName, row)
            } else {
                // We override without any deployment - remove
                // ac.set(row.envvarName, null)
                overrideMap.delete(row.envvarName)
            }
        }
    } else {
        if(row.mustDeploy === "deploy") {
            // First instance of a var to be deployed
            overrideMap.set(row.envvarName, row)
        }
    }
})

  const pendingChanges =  Array.from(overrideMap.values()).map((row) => {
      return {
        type:environmentPendingChangeTypes.ENVVAR,
        details: `Variable name: ${row.envvarName} (source: ${row.envvarSource} )`,
        date: row.envvarUpdated
      }
  })

  return pendingChanges;
}