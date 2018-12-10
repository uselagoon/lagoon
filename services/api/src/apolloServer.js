// @flow

const R = require('ramda');
const { ApolloServer, AuthenticationError } = require('apollo-server-express');
const { getCredentialsForLegacyToken, getCredentialsForKeycloakToken } = require('./util/auth');
const logger = require('./logger');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  debug: process.env.NODE_ENV === 'development',
  subscriptions: {
    onConnect: async (connectionParams, webSocket) => {
      const token = R.prop('authToken', connectionParams);
      let credentials;

      if (!token) {
        throw new AuthenticationError('Auth token missing.');
      }

      try {
        credentials = await getCredentialsForKeycloakToken(token);
      } catch (e) {
        // It might be a legacy token, so continue on.
        logger.debug(`Keycloak token auth failed: ${e.message}`);
      }

      try {
        if (!credentials) {
          credentials = await getCredentialsForLegacyToken(token);
        }
      } catch (e) {
        throw new AuthenticationError(e.message);
      }

      // Add credentials to context.
      return { credentials };
    },
  },
  context: ({ req, connection }) => {
    // Websocket requests
    if (connection) {
      // onConnect must always provide connection.context.
      return connection.context;
    }

    // HTTP requests
    if (!connection) {
      return {
        // Express middleware must always provide req.credentials.
        credentials: req.credentials,
      };
    }
  },
  formatError: (error) => {
    logger.warn(error.message);
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
    };
  },
});

module.exports = apolloServer;
