// @flow

const R = require('ramda');

// Returns a partial copy of an object containing only the keys specified, as long as they are non-nil.
module.exports = R.curry((
  names /* : $ReadOnlyArray<any> */,
  obj /* : { [string]: mixed } */,
) /* : Object */ =>
  R.pickBy((val, key) => R.contains(key, names) && !R.isNil(val))(obj));
