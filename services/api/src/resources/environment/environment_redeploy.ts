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
select e.id as env_id, e.name as env_name, ev.name as envvar_name, ev.updated as envvar_updated,
  COALESCE(
    IF(ev.environment IS NULL,NULL,'Environment'),
      IF(ev.project IS NULL,NULL,'Project'),
      IF(ev.organization IS NULL,NULL,'Organization')
      ) as envvar_source
FROM environment as e
INNER JOIN project as p ON p.id = e.project
LEFT JOIN organization as o ON o.id = p.organization
LEFT JOIN env_vars as ev ON (
   ev.environment = e.id OR
   ev.project = p.id OR
   ev.organization = o.id
)
WHERE ev.name IS NOT NULL AND e.id = ?
AND ev.updated > (select coalesce(max(completed), '0000-00-00 00:00:00') from deployment where environment = ? and status = ?)
ORDER BY ev.updated asc
`;

  const results = await query(sqlClientPool, sql, [envId, envId, 'complete']);

  const pendingChanges = results.map(row => {
    return {type:`Environment Variable - ${row.envvarSource} level`, details: row.envvarName, date: row.envvarUpdated};
  });

  return pendingChanges;
}