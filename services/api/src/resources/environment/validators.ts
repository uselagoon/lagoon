import * as R from 'ramda';
import { Pool } from 'mariadb';
import { query } from '../../util/db';
import { Sql } from './sql';

export const Validators = (sqlClientPool: Pool) => ({
  environmentExists: async (environmentId: number) => {
    const env = await query(
      sqlClientPool,
      Sql.selectEnvironmentById(environmentId)
    );

    if (R.length(env) == 0) {
      // environment doesn't exist, throw an unauthorized error
      throw new Error(`Unauthorized: You don't have permission to "view" on "environment"`);
    }
  },
  environmentsHaveSameProject: async (environmentIds: number[]) => {
    const rows = await query(
      sqlClientPool,
      'SELECT DISTINCT project FROM environment WHERE id in (?)',
      [environmentIds]
    );
    const projectIds = R.pluck('project', rows);

    // @ts-ignore
    if (R.length(R.uniq(projectIds)) > 1) {
      throw new Error(
        `Environments ${environmentIds.join(
          ','
        )} do not belong to the same project.`
      );
    }
  },
  environmentHasService: async (environmentId: number, service: string) => {
    const rows = await query(
      sqlClientPool,
      Sql.selectServicesByEnvironmentId(environmentId)
    );

    // @ts-ignore
    if (!R.contains(service, R.pluck('name', rows))) {
      throw new Error(`Environment ${environmentId} has no service ${service}`);
    }
  }
});
