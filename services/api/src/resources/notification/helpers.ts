import * as R from 'ramda';
import { Pool } from 'mariadb';
import { query } from '../../util/db';
import { Sql } from './sql';

export const Helpers = (sqlClientPool: Pool) => ({
  getAssignedNotificationIds: async (
    { name, type }: { name: string, type: string },
  ) => {
    const result = await query(
      sqlClientPool,
      Sql.selectProjectNotificationByNotificationName({ name, type }),
    );

    return R.map(R.prop('nid'), result);
  },
});
