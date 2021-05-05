import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
import * as R from 'ramda';
import { Pool, Connection } from 'mariadb';
import { notArray } from '../util/func';
import snakecase from './snakeCase';

export const knex = require('knex')({
  client: 'mysql',
  // Simplified version of converting input to snake case and
  // output to camel case from Objection.js
  // Ref: https://github.com/Vincit/objection.js/blob/89481597099e33d913bd7a7e437ff7a487c62fbd/lib/utils/identifierMapping.js
  wrapIdentifier: (identifier, origWrap) => origWrap(snakecase(identifier)),
  parseJsonResponse: response => {
    if (!response || typeof response !== 'object') {
      return response;
    } else if (Array.isArray(response)) {
      return R.map(camelcaseKeys, response);
    }
    return camelcaseKeys(response);
  }
});

/**
 * "Temporary" query utility for mariadb to replace mariasql. Intended to
 * reduce the pain of switching, not to markedly improve anything.
 *
 * Automatically converts snake_case <> camelCase as needed.
 *
 * @conn:
 *  - If passing a connection pool, a connection will be acquired and released
 *    automatically
 *  - If passing a connection, the caller is expected to acquire and release
 *    appropriately
 * @sql: A string with optional :placeholders for value escaping
 * @values: An optional parameter of values to escape
 *  - object where keys match the :placeholders
 *  - array when ? placeholders are used
 *
 * Example:
 *   const rows = await mQuery(sqlClientPool,
 *     'select * from project where git_url = :git_url',
 *     {
 *       gitUrl: 'ssh://git@172.17.0.1:2222/git/project18.git',
 *     });
 */
export const mQuery = async (
  conn: Pool | Connection,
  sql: string,
  values: Object | any[] = {}
): Promise<any> => {
  const preparedValues = R.when(notArray, snakecaseKeys);
  const rows = await conn.query(
    {
      dateStrings: true,
      namedPlaceholders: notArray(values),
      rowsAsArray: false,
      sql
    },
    preparedValues(values)
  );
  return R.length(rows) > 0 ? R.map(camelcaseKeys, rows) : rows;
};

export const isPatchEmpty = R.compose(
  R.isEmpty,
  R.propOr({}, 'patch')
);
