// @ts-ignore
import * as R from 'ramda';
// @ts-ignore
import { Pool } from 'mariadb';
import { query } from '../../util/db';
import { Sql } from './sql';

export const Helpers = (sqlClientPool: Pool) => {
  const getOrganizationById = async (id: number) => {
    const rows = await query(sqlClientPool, Sql.selectOrganization(id));
    return R.prop(0, rows);
  };
  return {
    getOrganizationById,
  }
};