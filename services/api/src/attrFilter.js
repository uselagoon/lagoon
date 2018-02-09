/*
  This module exposes a filter mechanism for GraphQL entities
  by user credentials.

  It's extracted in its own module for readability... it's supposed
  to be integrated in the dao module
*/

const R = require('ramda');

const openshift = R.curry((cred, entity) => {
  const role = cred.role;

  // Only admin is allowed to see all attributes
  if (role === 'admin') {
    return entity;
  }

  return R.omit(['token'], entity);
});

module.exports = {
  openshift,
};
