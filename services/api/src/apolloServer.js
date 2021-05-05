const R = require('ramda');
const {
  ApolloServer,
  AuthenticationError,
  makeExecutableSchema
} = require('apollo-server-express');
const NodeCache = require('node-cache');
const gql = require('graphql-tag');
const newrelic = require('newrelic');
const { getConfigFromEnv } = require('./util/config');
const {
  getCredentialsForLegacyToken,
  getGrantForKeycloakToken,
  legacyHasPermission,
  keycloakHasPermission
} = require('./util/auth');
const { getSqlClient, sqlClientPool } = require('./clients/sqlClient');
const esClient = require('./clients/esClient');
const redisClient = require('./clients/redisClient');
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
  debug: getConfigFromEnv('NODE_ENV') === 'development',
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
            token
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
        checkperiod: 0
      });

      const sqlClient = getSqlClient();

      return {
        keycloakAdminClient,
        sqlClient,
        sqlClientPool,
        hasPermission: grant
          ? keycloakHasPermission(grant, requestCache, keycloakAdminClient)
          : legacyHasPermission(legacyCredentials),
        keycloakGrant: grant,
        requestCache,
        models: {
          UserModel: User.User({ keycloakAdminClient, redisClient }),
          GroupModel: Group.Group({ keycloakAdminClient, sqlClient, redisClient, esClient }),
          BillingModel: BillingModel.BillingModel({
            keycloakAdminClient,
            sqlClient,
            esClient
          }),
          ProjectModel: ProjectModel.ProjectModel({
            keycloakAdminClient,
            sqlClient
          }),
          EnvironmentModel: EnvironmentModel.EnvironmentModel({ sqlClient, esClient })
        }
      };
    },
    onDisconnect: (websocket, context) => {
      if (context.sqlClient) {
        context.sqlClient.end();
      }
      if (context.requestCache) {
        context.requestCache.flushAll();
      }
    }
  },
  context: async ({ req, connection }) => {
    // Websocket requests
    if (connection) {
      // onConnect must always provide connection.context.
      return {
        ...connection.context
      };
    }

    // HTTP requests
    if (!connection) {
      const keycloakAdminClient = await getKeycloakAdminClient();
      const requestCache = new NodeCache({
        stdTTL: 0,
        checkperiod: 0
      });

      const sqlClient = getSqlClient();

      return {
        keycloakAdminClient,
        sqlClient,
        sqlClientPool,
        hasPermission: req.kauth
          ? keycloakHasPermission(
              req.kauth.grant,
              requestCache,
              keycloakAdminClient
            )
          : legacyHasPermission(req.legacyCredentials),
        keycloakGrant: req.kauth ? req.kauth.grant : null,
        requestCache,
        models: {
          UserModel: User.User({ keycloakAdminClient, redisClient }),
          GroupModel: Group.Group({ keycloakAdminClient, sqlClient, redisClient, esClient }),
          BillingModel: BillingModel.BillingModel({
            keycloakAdminClient,
            sqlClient,
            esClient
          }),
          ProjectModel: ProjectModel.ProjectModel({
            keycloakAdminClient,
            sqlClient
          }),
          EnvironmentModel: EnvironmentModel.EnvironmentModel({
            keycloakAdminClient,
            sqlClient,
            esClient
          })
        }
      };
    }
  },
  formatError: error => {
    logger.warn(error.message);
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
      ...(getConfigFromEnv('NODE_ENV') === 'development'
        ? { extensions: error.extensions }
        : {})
    };
  },
  plugins: [
    // mariasql client closer plugin
    {
      requestDidStart: () => ({
        willSendResponse: response => {
          if (response.context.sqlClient) {
            response.context.sqlClient.end();
          }
          if (response.context.requestCache) {
            response.context.requestCache.flushAll();
          }
        }
      })
    },
    // newrelic instrumentation plugin. Based heavily on https://github.com/essaji/apollo-newrelic-extension-plus
    {
      requestDidStart({ request }) {
        const operationName = R.prop('operationName', request);
        const queryString = R.prop('query', request);
        const variables = R.prop('variables', request);

        const queryObject = gql`
          ${queryString}
        `;
        const rootFieldName = queryObject.definitions[0].selectionSet.selections.reduce(
          (init, q, idx) =>
            idx === 0 ? `${q.name.value}` : `${init}, ${q.name.value}`,
          ''
        );

        // operationName is set by the client and optional. rootFieldName is
        // set by the API type defs.
        // operationName would be "getHighCottonProjectId" and rootFieldName
        // would be "getProjectByName" with a query like:
        // query getHighCottonProjectId { getProjectByName(name: "high-cotton") { id } }
        const transactionName = operationName ? operationName : rootFieldName;
        newrelic.setTransactionName(`graphql (${transactionName})`);
        newrelic.addCustomAttribute('gqlQuery', queryString);
        newrelic.addCustomAttribute('gqlVars', JSON.stringify(variables));

        return {
          willSendResponse: data => {
            const { response } = data;
            newrelic.addCustomAttribute(
              'errorCount',
              R.pipe(
                R.propOr([], 'errors'),
                R.length
              )(response)
            );
          }
        };
      }
    }
  ]
});

module.exports = apolloServer;
