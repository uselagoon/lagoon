// @flow

import express from 'express';
import statusRoute from './status';
import keysRoute from './keys';
import graphqlRoute from './graphql';

import type { $Request, $Response, Router } from 'express';

export default function createRouter(): Router {
  const router = new express.Router();

  // Redirect GET requests on "/" to the status route.
  router.get('/', (req: $Request, res: $Response) => res.redirect('/status'));

  // Fetch the current api status.
  router.get('/status', ...statusRoute);

  // Return keys of all clients from clients.yaml.
  router.get('/keys', ...keysRoute);

  // Enable graphql requests.
  router.all('/graphql', ...graphqlRoute);

  return router;
}
