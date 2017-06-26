// @flow

import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import bodyParser from 'body-parser';
import logger from './logger';
import createRouter from './routes';

import type { ApiStore } from './createStore';

// flow needs this explicitly annotated to correctly type the express
// interface
function route404(req: express$Request, res: express$Response) {
  return res
    .status(404)
    .json({
      status: 'error',
      message: `No endpoint exists at ${req.originalUrl} (method: ${req.method})`,
    });
}

export default (store: ApiStore): express$Application => {
  const app = express();

  // Use compression (gzip) for responses.
  app.use(compression());

  // Automatically decode json.
  app.use(bodyParser.json());

  // Add custom configured logger (morgan through winston).
  app.use(
    morgan('combined', { stream: { write: message => logger.info(message) } }),
  );

  const router = createRouter(store);

  // Add routes.
  app.use('/', router);

  // Respond with 404 to any routes not matching API endpoints.
  app.all('/*', route404);

  return app;
};
