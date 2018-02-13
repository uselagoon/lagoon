const R = require('ramda');
const knex = require('knex')({ client: 'mysql' });

// Useful for creating extra if-conditions for non-admins
const ifNotAdmin = (role, str) =>
  R.ifElse(R.equals('admin'), R.always(''), R.always(str))(role);

/**
  ATTENTION:
  all those SQL-esque helpers like whereAnd, inClause, etc.
  are subject to be obsolete. We are planning to migrate to
  a dedicated SQL-builder lib (knex)
**/

// Creates a WHERE statement with AND inbetween non-empty conditions
const whereAnd = whereConds =>
  R.compose(
    R.reduce((ret, str) => {
      if (ret === '') {
        return `WHERE ${str}`;
      } else {
        return `${ret} AND ${str}`;
      }
    }, ''),
    R.filter(R.compose(R.not, R.isEmpty)),
  )(whereConds);

// Creates an IN clause like this: $field IN (val1,val2,val3)
// or on empty values: $field IN (NULL)
const inClause = (field, values) =>
  R.compose(
    str => `${field} IN (${str})`,
    R.ifElse(R.isEmpty, R.always('NULL'), R.identity),
    R.join(','),
    R.defaultTo([]),
  )(values);

const inClauseOr = conds =>
  R.compose(
    R.reduce((ret, str) => {
      if (ret === '') {
        return str;
      } else {
        return `${ret} OR ${str}`;
      }
    }, ''),
    R.map(([field, values]) => inClause(field, values)),
  )(conds);

// Promise wrapper for doing sql queries
const query = (sqlClient, sql) =>
  new Promise((res, rej) => {
    sqlClient.query(sql, (err, rows) => {
      if (err) {
        rej(err);
      }
      res(rows);
    });
    setTimeout(() => {
      rej('Timeout while talking to the Database');
    }, 2000);
  });

// We use this just for consistency of the api calls
const prepare = (sqlClient, sql) => sqlClient.prepare(sql);

module.exports = {
  ifNotAdmin,
  inClause,
  inClauseOr,
  knex,
  prepare,
  query,
  whereAnd,
};
