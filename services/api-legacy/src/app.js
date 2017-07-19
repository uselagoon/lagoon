import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import bodyParser from 'body-parser';
import logger from './logger';
import routes from './routes';

export default (repository) => {
  const app = express();

  // Use compression (gzip) for responses.
  app.use(compression());

  // Automatically decode json.
  app.use(bodyParser.json());

  // Add custom configured logger (morgan through winston).
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message),
    },
  }));

  // Add routes.
  app.use('/', routes);

  // Respond with 404 to any routes not matching API endpoints.
  app.all('/*', (request, response) => response.status(404).json({
    status: 'error',
    message: `No endpoint exists at ${request.originalUrl} (method: ${request.method})`,
  }));

  // Store the repository as a global.
  app.set('repository', repository);

  return app;
};
