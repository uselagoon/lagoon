// @flow

const camelcaseKeys = require('camelcase-keys');
const R = require('ramda');
const snakecase = require('../util/snakeCase');
const snakecaseKeys = require('snakecase-keys');
const knex = require('knex')({
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

/* ::

import type MariaSQL from 'mariasql';

*/

// Useful for creating extra if-conditions for non-admins
const ifNotAdmin = (role /* : string */, str /* : string */) =>
  R.ifElse(R.equals('admin'), R.always(''), R.always(str))(role);

/**
  ATTENTION:
  All of the SQL helpers below such as whereAnd,
  inClause, etc. are obsolete. They should be migrated to our
  dedicated SQL-builder lib (knex).
* */

// Creates a WHERE statement with AND inbetween non-empty conditions
const whereAnd = (whereConds /* : Array<string> */) =>
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
  )(whereConds);

// Creates an IN clause like this: $field IN (val1,val2,val3)
// or on empty values: $field IN (NULL)
const inClause = (field /* : string */, values /* : Array<string> */) =>
  R.compose(
    str => `${field} IN (${str})`,
    R.ifElse(R.isEmpty, R.always('NULL'), R.identity),
    R.join(','),
    R.defaultTo([]),
  )(values);

const inClauseOr = (conds /* : Array<any> */) =>
  R.compose(
    R.reduce((ret, str) => {
      if (ret === '') {
        return str;
      }
      return `${ret} OR ${str}`;
    }, ''),
    // prettier-ignore
    R.map(([
      field /* : string */,
      values /* : Array<string> */,
    ]) =>
      inClause(field, values),
    ),
  )(conds);

// Promise wrapper for doing SQL queries, also camelcases any responses
const query = (sqlClient /* : MariaSQL */, sql /* : string */) =>
  new Promise((resolve, reject) => {
    sqlClient.query(sql, (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(R.length(rows) > 0 ? R.map(camelcaseKeys, rows) : rows);
    });
    setTimeout(() => {
      reject('Timeout while talking to the Database');
    }, 30000);
  });

// Snakecase any input
const prepare = (sqlClient /* : MariaSQL */, sql /* : string */) => {
  const prep = sqlClient.prepare(sql);
  return (input /* : Object */) => prep(snakecaseKeys(input));
};

const isPatchEmpty = R.compose(
  R.isEmpty,
  R.propOr({}, 'patch'),
);

module.exports = {
  ifNotAdmin,
  inClause,
  inClauseOr,
  knex,
  prepare,
  query,
  whereAnd,
  isPatchEmpty,
};
