// @flow

const R = require('ramda');
const {
  ApolloServer,
  AuthenticationError,
  makeExecutableSchema,
} = require('apollo-server-express');
const { applyMiddleware } = require('graphql-middleware');
const {
  getCredentialsForLegacyToken,
  getGrantForKeycloakToken,
  legacyHasPermission,
  keycloakHasPermission,
} = require('./util/auth');
const { getSqlClient } = require('./clients/sqlClient');
const logger = require('./logger');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const User = require('./models/user');
const Group = require('./models/group');

const schema = makeExecutableSchema({ typeDefs, resolvers });

const apolloServer = new ApolloServer({
  schema,
  debug: process.env.NODE_ENV === 'development',
  introspection: true,
  subscriptions: {
    onConnect: async (connectionParams, webSocket) => {
      const token = R.prop('authToken', connectionParams);
      let grant;
      let legacyCredentials;

      if (!token) {
        throw new AuthenticationError('Auth token missing.');
      }

      try {
        grant = await getGrantForKeycloakToken(getSqlClient(), token);
      } catch (e) {
        // It might be a legacy token, so continue on.
        logger.debug(`Keycloak token auth failed: ${e.message}`);
      }

      try {
        if (!grant) {
          legacyCredentials = await getCredentialsForLegacyToken(
            getSqlClient(),
            token,
          );
        }
      } catch (e) {
        throw new AuthenticationError(e.message);
      }

      // Add credentials to context.
      return {
        hasPermission: grant
          ? keycloakHasPermission(grant)
          : legacyHasPermission(legacyCredentials),
      };
    },
  },
  dataSources: () => ({
    UserModel: User.User(),
    GroupModel: Group.Group(),
  }),
  context: ({ req, connection }) => {
    // Websocket requests
    if (connection) {
      // onConnect must always provide connection.context.
      return {
        ...connection.context,
        sqlClient: getSqlClient(),
      };
    }

    // HTTP requests
    if (!connection) {
      return {
        sqlClient: getSqlClient(),
        hasPermission: req.kauth
          ? keycloakHasPermission(req.kauth.grant)
          : legacyHasPermission(req.legacyCredentials),
      };
    }
  },
  formatError: error => {
    logger.warn(error.message);
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
    };
  },
  plugins: [
    {
      requestDidStart: () => ({
        willSendResponse: response => {
          if (response.context.sqlClient) {
            response.context.sqlClient.end();
          }
        },
      }),
    },
  ],
});

module.exports = apolloServer;
