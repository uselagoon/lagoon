import * as R from 'ramda';
import { Pool } from 'mariadb';
import { query } from '../../util/db';
import { Sql } from './sql';

export const Helpers = (sqlClientPool: Pool) => {
  const getInsightById = async (fileId: number) => {
    const rows = await query(
      sqlClientPool,
      Sql.selectInsightId(fileId)
    );
    return R.prop(0, rows);
  };

  return {
    getInsightById
  };
};
