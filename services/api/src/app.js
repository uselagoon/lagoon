const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const cors = require('cors');
const { json } = require('body-parser');
const logger = require('./logger');
const { createRouter } = require('./routes');
const { authMiddleware } = require('./authMiddleware');
const apolloServer = require('./apolloServer');
const userActivityLogger = require('./userActivityLogger');

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

// Temp: this could also be captured in apollo context
app.use('/graphql', (req, res, next) => {

  // const headers = req.headers ? {
  //   user_agent: req.headers['user-agent'] ? req.headers['user-agent'] : '',
  //   host: req.headers.host ? req.headers.host : '',
  //   origin: req.headers.origin ? req.headers.origin : ''
  // } : '';

  // if (req.kauth) {
  //   const { aud, sub, azp, auth_time, preferred_username, email, realm_access } = req.kauth.grant.access_token.content;
  //   const username = preferred_username ? preferred_username : 'unknown';
  //   const user_email = email ? email : 'unknown';
  //   const source = azp ? azp : 'unknown';
  //   const operation = req.body.operationName ? req.body.operationName : 'graphql-query';

  //   userActivityLogger.user_action(`User '${username} (${user_email})' requested '${operation}' via '${source}' on ${headers.origin}`, {
  //     id: sub,
  //     username: preferred_username,
  //     email: user_email,
  //     aud: aud,
  //     source: source,
  //     roles: realm_access.roles,
  //     headers: headers,
  //     action: req.body
  //   });
  // }
  // else {
  //   // If legacy token
  //   const { legacyCredentials } = req;

  //   const { sub, iss, iat, role } = legacyCredentials;
  //   const username = sub ? sub : 'unknown';
  //   const source = iss ? iss : 'unknown';
  //   const operation = req.body.operationName ? req.body.operationName : req.body;

  //   userActivityLogger.user_action(`User '${username}' requested '${operation}' via '${headers.user_agent}' on ${headers.host}`, {
  //     id: iat,
  //     username: sub,
  //     source: iss,
  //     roles: role,
  //     headers: headers,
  //     action: req.body
  //   });
  // }

  return next()
})


// Add routes.
app.use('/', createRouter());

apolloServer.applyMiddleware({ app });

module.exports = app;
