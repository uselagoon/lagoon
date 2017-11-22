// @flow

const express = require('express');
const statusRoute = require('./status');
const keysRoute = require('./keys');
const graphqlRoute = require('./graphql');

function createRouter() {
  const router = new express.Router();

  // Redirect GET requests on "/" to the status route.
  router.get('/', (req, res) => res.redirect('/status'));

  // Fetch the current api status.
  router.get('/status', ...statusRoute);

  // Return keys of all clients from clients.yaml.
  router.post('/keys', ...keysRoute);

  // Enable graphql requests.
  router.all('/graphql', ...graphqlRoute);

  return router;
}

module.exports = createRouter;
