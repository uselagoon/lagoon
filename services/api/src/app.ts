import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import { json } from 'body-parser';
import { logger } from './loggers/logger';
import { createRouter } from './routes';
import { authMiddleware } from './authMiddleware';
import { requestMiddleware } from './requestMiddleware';
import { getApolloServer } from './apolloServer';

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
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apollo-require-preflight']
}));

app.use(requestMiddleware);
app.use(authMiddleware);

// Add routes.
app.use('/', createRouter());

// app.use(graphqlUploadExpress());
export async function configureApp() {
  async function setupGraphQLUpload() {
    try {
      const { default: graphqlUploadExpress } = await import("graphql-upload/graphqlUploadExpress.mjs");
      app.use(graphqlUploadExpress({}) as unknown as express.RequestHandler);
    } catch (error) {
      logger.error("Failed to load or setup graphql-upload:", error);
      throw error;
    }
  }
  await setupGraphQLUpload();

  try {
    const apolloServer = await getApolloServer();
    await apolloServer.start();
    apolloServer.applyMiddleware({
      app,
      cors: false
    });
  } catch (error) {
    logger.error("Failed to start or apply Apollo Server middleware:", error);
    throw error;
  }

}
