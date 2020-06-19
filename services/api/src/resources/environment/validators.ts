import * as R from 'ramda';
import { MariaClient } from 'mariasql';
import { prepare, query } from '../../util/db';
import { Sql } from './sql';

export const Validators = (sqlClient: MariaClient) => ({
  environmentExists: async (environmentId: number) => {
    const env = await query(
      sqlClient,
      Sql.selectEnvironmentById(environmentId),
    );

    if (R.has('info', env)) {
      throw new Error(`Environment ID ${environmentId} doesn't exist.`);
    }
  },
  environmentsHaveSameProject: async (environmentIds: number[]) => {
    const preparedQuery = prepare(
      sqlClient,
      `
      SELECT DISTINCT project FROM environment WHERE id in (?)
    `,
    );

    const rows = await query(sqlClient, preparedQuery([environmentIds]));
    const projectIds = R.pluck('project', rows);

    // @ts-ignore
    if (R.length(R.uniq(projectIds)) > 1) {
      throw new Error(
        `Environments ${environmentIds.join(
          ',',
        )} do not belong to the same project.`,
      );
    }
  },
  environmentHasService: async (
    environmentId: number,
    service: string,
  ) => {
    const rows = await query(
      sqlClient,
      Sql.selectServicesByEnvironmentId(environmentId),
    );

    // @ts-ignore
    if (!R.contains(service, R.pluck('name', rows))) {
      throw new Error(`Environment ${environmentId} has no service ${service}`);
    }
  },
});
