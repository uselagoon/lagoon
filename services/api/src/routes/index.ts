import express, { Request, Response } from 'express';
import statusRoute from './status';
import keysRoute from './keys';
import wellKnown from './well-known';

export function createRouter() {
  const router = express.Router();

  // Redirect GET requests on "/" to the status route.
  router.get('/', (req: Request, res: Response) =>
    res.redirect('/status'),
  );

  // Fetch the current api status.
  router.get('/status', ...statusRoute);

  // Fetch the well-known.
  router.get('/.well-known/appspecific/sh.lagoon.discovery.json', ...wellKnown);

  // Return keys of all customers
  router.post('/keys', ...keysRoute);

  return router;
}
