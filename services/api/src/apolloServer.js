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
const { getKeycloakAdminClient } = require('./clients/keycloak-admin');
const logger = require('./logger');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const User = require('./models/user');
const Group = require('./models/group');
const BillingModel = require('./models/billing');
const ProjectModel = require('./models/project');
const EnvironmentModel = require('./models/environment');

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

      const sqlClientKeycloak = getSqlClient();
      try {
        grant = await getGrantForKeycloakToken(sqlClientKeycloak, token);
        sqlClientKeycloak.end();
      } catch (e) {
        sqlClientKeycloak.end();
        // It might be a legacy token, so continue on.
        logger.debug(`Keycloak token auth failed: ${e.message}`);
      }

      const sqlClientLegacy = getSqlClient();
      try {
        if (!grant) {
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

      const keycloakAdminClient = await getKeycloakAdminClient();
      const requestCache = new NodeCache({
        stdTTL: 0,
        checkperiod: 0,
      });

      const sqlClient = getSqlClient();

      return {
        keycloakAdminClient,
        sqlClient,
        hasPermission: grant
          ? keycloakHasPermission(grant, requestCache, keycloakAdminClient)
          : legacyHasPermission(legacyCredentials),
        keycloakGrant: grant,
        requestCache,
        models: {
          UserModel: User.User({ keycloakAdminClient }),
          GroupModel: Group.Group({ keycloakAdminClient }),
          BillingModel: BillingModel.BillingModel({ keycloakAdminClient, sqlClient }),
          ProjectModel: ProjectModel.ProjectModel({ keycloakAdminClient, sqlClient }),
          EnvironmentModel: EnvironmentModel.EnvironmentModel({ sqlClient })
        },
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
  context: async ({ req, connection }) => {
    // Websocket requests
    if (connection) {
      // onConnect must always provide connection.context.
      return {
        ...connection.context,
      };
    }

    // HTTP requests
    if (!connection) {
      const keycloakAdminClient = await getKeycloakAdminClient();
      const requestCache = new NodeCache({
        stdTTL: 0,
        checkperiod: 0,
      });

      const sqlClient = getSqlClient()

      return {
        keycloakAdminClient,
        sqlClient,
        hasPermission: req.kauth
          ? keycloakHasPermission(
              req.kauth.grant,
              requestCache,
              keycloakAdminClient,
            )
          : legacyHasPermission(req.legacyCredentials),
        keycloakGrant: req.kauth ? req.kauth.grant : null,
        requestCache,
        models: {
          UserModel: User.User({ keycloakAdminClient }),
          GroupModel: Group.Group({ keycloakAdminClient, sqlClient }),
          BillingModel: BillingModel.BillingModel({ keycloakAdminClient, sqlClient }),
          ProjectModel: ProjectModel.ProjectModel({ keycloakAdminClient, sqlClient }),
          EnvironmentModel: EnvironmentModel.EnvironmentModel({ keycloakAdminClient, sqlClient })
        },
      };
    }
  },
  formatError: error => {
    logger.warn(error.message);
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
      ...(process.env.NODE_ENV === 'development'
        ? { extensions: error.extensions }
        : {}),
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
