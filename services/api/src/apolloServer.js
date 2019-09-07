// @flow

const R = require('ramda');
const {
  ApolloServer,
  AuthenticationError,
  makeExecutableSchema,
} = require('apollo-server-express');
const NodeCache = require('node-cache');
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
        var sqlClientKeycloak = getSqlClient();
        grant = await getGrantForKeycloakToken(sqlClientKeycloak, token);
        sqlClientKeycloak.end();
      } catch (e) {
        sqlClientKeycloak.end();
        // It might be a legacy token, so continue on.
        logger.debug(`Keycloak token auth failed: ${e.message}`);
      }

      try {
        if (!grant) {
          var sqlClientLegacy = getSqlClient();
          legacyCredentials = await getCredentialsForLegacyToken(
            sqlClientLegacy,
            token,
          );
          sqlClientLegacy.end();
        }
      } catch (e) {
        sqlClientLegacy.end();
        throw new AuthenticationError(e.message);
      }

      const requestCache = new NodeCache({
        stdTTL: 0,
        checkperiod: 0,
      });

      return {
        sqlClient: getSqlClient(),
        hasPermission: grant
          ? keycloakHasPermission(grant, requestCache)
          : legacyHasPermission(legacyCredentials),
        keycloakGrant: grant,
        requestCache,
      };
    },
    onDisconnect: (websocket, context) => {
      if (context.sqlClient) {
        context.sqlClient.end();
      }
      if (context.requestCache) {
        context.requestCache.flushAll();
      }
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
      };
    }

    // HTTP requests
    if (!connection) {
      const requestCache = new NodeCache({
        stdTTL: 0,
        checkperiod: 0,
      });

      return {
        sqlClient: getSqlClient(),
        hasPermission: req.kauth
          ? keycloakHasPermission(req.kauth.grant, requestCache)
          : legacyHasPermission(req.legacyCredentials),
        keycloakGrant: req.kauth
          ? req.kauth.grant
          : null,
        requestCache,
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
          if (response.context.requestCache) {
            response.context.requestCache.flushAll();
          }
        },
      }),
    },
  ],
});

module.exports = apolloServer;
