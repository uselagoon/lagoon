const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const cors = require('cors');
const { json } = require('body-parser');
const logger = require('./loggers/logger');
const { createRouter } = require('./routes');
const { authMiddleware } = require('./authMiddleware');
const apolloServer = require('./apolloServer');

const app = express();

// Use compression (gzip) for responses.
app.use(compression());

// Automatically decode json.
app.use(json());

// Add custom configured logger (morgan through winston).
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message),
    },
  }),
);

// TODO: Restrict requests to lagoon domains?
app.use(cors());

app.use(authMiddleware);

// Add routes.
app.use('/', createRouter());

apolloServer.applyMiddleware({ app });

module.exports = app;
