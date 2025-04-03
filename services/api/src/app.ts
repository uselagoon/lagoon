import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import { json } from 'body-parser';
import { logger } from './loggers/logger';
import { createRouter } from './routes';
import { authMiddleware } from './authMiddleware';
import { requestMiddleware } from './requestMiddleware';
import apolloServer from './apolloServer';

export const app = express();

// Use compression (gzip) for responses.
app.use(compression());

// Automatically decode json.
app.use(json());

// Add custom configured logger (morgan through winston).
app.use(
  morgan('combined', {
    skip: (req, res) => {
      if (req.originalUrl.startsWith('/status')) {
        return req.originalUrl.startsWith('/status')
      }
      if (req.originalUrl.startsWith('/favicon.ico')) {
        return req.originalUrl.startsWith('/favicon.ico')
      }
      if (req.originalUrl.startsWith('/.well-known')) {
        return req.originalUrl.startsWith('/.well-known')
      }
    },
    stream: {
      write: message => logger.info(message.trim())
    }
  })
);

// TODO: Restrict requests to lagoon domains?
app.use(cors());

app.use(requestMiddleware);
app.use(authMiddleware);

// Add routes.
app.use('/', createRouter());

// app.use(graphqlUploadExpress());
async function setupGraphQLUpload() {
  try {
    const { graphqlUploadExpress } = (await import("graphql-upload")) as any;
    app.use(graphqlUploadExpress());
  } catch (error) {
    console.error("Failed to load graphql-upload:", error);
  }
}

setupGraphQLUpload();

apolloServer.applyMiddleware({ app });
