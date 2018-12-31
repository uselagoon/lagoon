// @flow

const express = require('express');
const statusRoute = require('./status');
const keysRoute = require('./keys');

/* ::
import type { $Request, $Response } from 'express';
*/

function createRouter() {
  const router = new express.Router();

  // Redirect GET requests on "/" to the status route.
  router.get('/', (req /* : $Request */, res /* : $Response */) =>
    res.redirect('/status'),
  );

  // Fetch the current api status.
  router.get('/status', ...statusRoute);

  // Return keys of all customers
  router.post('/keys', ...keysRoute);

  return router;
}

module.exports = createRouter;
