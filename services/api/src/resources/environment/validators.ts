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

    if (R.has('info', env)) {
      throw new Error(`Environment ID ${environmentId} doesn't exist.`);
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
