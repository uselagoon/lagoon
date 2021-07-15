import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import { json } from 'body-parser';
import { logger } from './loggers/logger';
import { createRouter } from './routes';
import { authMiddleware } from './authMiddleware';
import apolloServer from './apolloServer';

export const app = express();

// Use compression (gzip) for responses.
app.use(compression());

// Automatically decode json.
app.use(json());

// Add custom configured logger (morgan through winston).
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message)
    }
  })
);

// TODO: Restrict requests to lagoon domains?
app.use(cors());

app.use(authMiddleware);

// Add routes.
app.use('/', createRouter());

apolloServer.applyMiddleware({ app });
