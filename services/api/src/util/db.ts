import camelcaseKeys from 'camelcase-keys';
import * as R from 'ramda';
import { MariaClient, MariaResult, MariaInfo } from 'mariasql';
import snakecase from './snakeCase';
import snakecaseKeys from 'snakecase-keys';

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
  },
});

// Useful for creating extra if-conditions for non-admins
export const ifNotAdmin = (role: string, str: string) =>
  R.ifElse(R.equals('admin'), R.always(''), R.always(str))(role);

/**
  ATTENTION:
  All of the SQL helpers below such as whereAnd,
  inClause, etc. are obsolete. They should be migrated to our
  dedicated SQL-builder lib (knex).
* */

// Creates a WHERE statement with AND inbetween non-empty conditions
export const whereAnd = (whereConds: string[]) =>
  R.compose(
    R.reduce((acc, curr) => {
      if (acc === '') {
        return `WHERE ${curr}`;
      }
      return `${acc} AND ${curr}`;
    }, ''),
    R.filter(
      R.compose(
        R.not,
        R.isEmpty,
      ),
    ),
  // @ts-ignore
  )(whereConds);

// Creates an IN clause like this: $field IN (val1,val2,val3)
// or on empty values: $field IN (NULL)
export const inClause = (field: string, values: string[]) =>
  R.compose(
    str => `${field} IN (${str})`,
    R.ifElse(R.isEmpty, R.always('NULL'), R.identity),
    R.join(','),
    R.defaultTo([]),
  // @ts-ignore
  )(values);

export const inClauseOr = (conds: any[]) =>
  R.compose(
    R.reduce((ret, str) => {
      if (ret === '') {
        return str;
      }
      return `${ret} OR ${str}`;
    }, ''),
    // prettier-ignore
    R.map(([
      field,
      values,
    ]: [
      string,
      string[],
    ]) =>
      inClause(field, values),
    ),
  // @ts-ignore
  )(conds);

// Promise wrapper for doing SQL queries, also camelcases any responses
export const query = (sqlClient: MariaClient, sql: string): Promise<any> =>
  new Promise((resolve, reject) => {
    sqlClient.query(sql, (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(R.length(rows) > 0 ? R.map(camelcaseKeys, rows) : rows);
    });
    setTimeout(() => {
      reject('Timeout while talking to the Database');
    }, 60000);
  });

// Snakecase any input
export const prepare = (sqlClient: MariaClient, sql: string) => {
  const prep = sqlClient.prepare(sql);
  return (input: any) => prep(snakecaseKeys(input));
};

export const isPatchEmpty = R.compose(
  R.isEmpty,
  R.propOr({}, 'patch'),
);
