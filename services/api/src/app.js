const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const cors = require('cors');
const { json } = require('body-parser');
const logger = require('./logger');
const { createRouter } = require('./routes');
const { authMiddleware } = require('./authMiddleware');
const apolloServer = require('./apolloServer');

const app = express();

// Use compression (gzip) for responses.
app.use(compression());

// Automatically decode json.
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

// Catch errors since some browsers throw when using the new `type` option.
// https://bugs.webkit.org/show_bug.cgi?id=209216
try {
  // Create the performance observer.
  const po = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Logs all server timing data for this response
      console.log('Server Timing', entry.serverTiming);
    }
  });
  // Start listening for `navigation` entries to be dispatched.
  po.observe({type: 'navigation', buffered: true});
} catch (e) {
  // Do nothing if the browser doesn't support this API.
}


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
