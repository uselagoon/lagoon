import { Pool } from 'mariadb';
import { query } from '../../util/db';
import { Sql } from './sql';
// import { logger } from '../../loggers/logger';

export const Helpers = (sqlClientPool: Pool) => {
    return {
        deleteUserSshKeys: async (id: string) => {
          // logger.debug(`deleting project ${id} notifications`)
          await query(
            sqlClientPool,
            Sql.deleteUserSshKeys(id)
          );
        }
    };
};