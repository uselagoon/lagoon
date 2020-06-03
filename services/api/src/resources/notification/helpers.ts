import * as R from 'ramda';
import { MariaClient } from 'mariasql';
import { query } from '../../util/db';
import { Sql } from './sql';

export const Helpers = (sqlClient: MariaClient) => ({
  getAssignedNotificationIds: async (
    { name, type }: { name: string, type: string },
  ) => {
    const result = await query(
      sqlClient,
      Sql.selectProjectNotificationByNotificationName({ name, type }),
    );

    return R.map(R.prop('nid'), result);
  },
});
