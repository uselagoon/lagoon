import { Pool } from 'mariadb';
import { query } from '../../util/db';
import { Sql } from './sql';

export const Helpers = (sqlClientPool: Pool) => {

  const getProjectsByIds = (
    projectIds: number[],
    limit: number,
    skip: number,
  ) =>

  query(sqlClientPool, Sql.selectProjectsByIdsAndFilter(projectIds, limit, skip));

  return {
    getProjectsByIds,
  };
};
