const R = require('ramda');
const {
  ApolloServer,
  AuthenticationError,
  makeExecutableSchema
} = require('apollo-server-express');
const NodeCache = require('node-cache');
const gql = require('graphql-tag');
const newrelic = require('newrelic');
const { decode } = require('jsonwebtoken');
const { getConfigFromEnv } = require('./util/config');
const {
  isLegacyToken,
  isKeycloakToken,
  getCredentialsForLegacyToken,
  getGrantForKeycloakToken,
  legacyHasPermission,
  keycloakHasPermission
} = require('./util/auth');
const { sqlClientPool } = require('./clients/sqlClient');
const esClient = require('./clients/esClient');
const redisClient = require('./clients/redisClient');
const { getKeycloakAdminClient } = require('./clients/keycloak-admin');
const { logger } = require('./loggers/logger');
const { userActivityLogger } = require('./loggers/userActivityLogger');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

const User = require('./models/user');
const Group = require('./models/group');
const ProjectModel = require('./models/project');
const EnvironmentModel = require('./models/environment');

const schema = makeExecutableSchema({ typeDefs, resolvers });

const getGrantOrLegacyCredsFromToken = async token => {
  const decodedToken = decode(token, { json: true, complete: true });

  if (isLegacyToken(decodedToken)) {
    try {
      const legacyCredentials = await getCredentialsForLegacyToken(token);

      const { sub, iss } = legacyCredentials;
      const username = sub ? sub : 'unknown';
      const source = iss ? iss : 'unknown';
      userActivityLogger.user_auth(
        `Authentication granted for '${username}' from '${source}'`,
        { user: legacyCredentials }
      );

      return {
        grant: null,
        legacyCredentials
      };
    } catch (e) {
      throw new AuthenticationError(`Legacy token invalid: ${e.message}`);
    }
  } else if (isKeycloakToken(decodedToken)) {
    try {
      const grant = await getGrantForKeycloakToken(token);

      if (grant.access_token) {
        const {
          azp: source,
          preferred_username,
          email
        } = grant.access_token.content;
        const username = preferred_username ? preferred_username : 'unknown';

        userActivityLogger.user_auth(
          `Authentication granted for '${username} (${
            email ? email : 'unknown'
          })' from '${source}'`,
          { user: grant ? grant.access_token.content : null }
        );
      }

      return {
        grant,
        legacyCredentials: null
      };
    } catch (e) {
      throw new AuthenticationError(`Keycloak token invalid: ${e.message}`);
    }
  } else {
    throw new AuthenticationError(`Bearer token unrecognized`);
    return {
      grant: null,
      legacyCredentials: null
    };
  }
};

const apolloServer = new ApolloServer({
  schema,
  debug: getConfigFromEnv('NODE_ENV') === 'development',
  introspection: true,
  uploads: false, // Disable built in support for file uploads and configure it manually
  subscriptions: {
    onConnect: async (connectionParams, webSocket) => {
      const token = R.prop('authToken', connectionParams);

      if (!token) {
        throw new AuthenticationError('Auth token missing.');
      }

      const { grant, legacyCredentials } = await getGrantOrLegacyCredsFromToken(
        token
      );
      const keycloakAdminClient = await getKeycloakAdminClient();
      const requestCache = new NodeCache({
        stdTTL: 0,
        checkperiod: 0
      });

      const modelClients = {
        sqlClientPool,
        keycloakAdminClient,
        esClient,
        redisClient
      };

      return {
        keycloakAdminClient,
        sqlClientPool,
        hasPermission: grant
          ? keycloakHasPermission(grant, requestCache, modelClients)
          : legacyHasPermission(legacyCredentials),
        keycloakGrant: grant,
        requestCache,
        models: {
          UserModel: User.User(modelClients),
          GroupModel: Group.Group(modelClients),
          ProjectModel: ProjectModel.ProjectModel(modelClients),
          EnvironmentModel: EnvironmentModel.EnvironmentModel(modelClients)
        }
      };
    },
    onDisconnect: (websocket, context) => {
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

      const modelClients = {
        sqlClientPool,
        keycloakAdminClient,
        esClient,
        redisClient
      };

      return {
        keycloakAdminClient,
        sqlClientPool,
        hasPermission: req.kauth
          ? keycloakHasPermission(req.kauth.grant, requestCache, modelClients)
          : legacyHasPermission(req.legacyCredentials),
        keycloakGrant: req.kauth ? req.kauth.grant : null,
        requestCache,
        userActivityLogger: (message, meta) => {
          let defaultMeta = {
            user: req.kauth
              ? req.kauth.grant
              : req.legacyCredentials
              ? req.legacyCredentials
              : null,
            headers: req.headers
          };
          return userActivityLogger.user_action(message, {
            ...defaultMeta,
            ...meta
          });
        },
        models: {
          UserModel: User.User(modelClients),
          GroupModel: Group.Group(modelClients),
          ProjectModel: ProjectModel.ProjectModel(modelClients),
          EnvironmentModel: EnvironmentModel.EnvironmentModel(modelClients)
        }
      };
    }
  },
  formatError: error => {
    logger.error('GraphQL field error `' + error.path + '`: ' + error.message);
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
    // Debug plugin for logging resolver execution order
    // {
    //   requestDidStart(initialRequestContext) {
    //     return {
    //       executionDidStart(executionRequestContext) {
    //         return {
    //           willResolveField({source, args, context, info}) {
    //             console.log(`Resolving ${info.parentType.name}.${info.fieldName}`);
    //             const start = process.hrtime.bigint();
    //             return (error, result) => {
    //               const end = process.hrtime.bigint();
    //               // Uncomment to log resolver execution time
    //               // console.log(`Field ${info.parentType.name}.${info.fieldName} took ${end - start}ns`);
    //             };
    //           }
    //         }
    //       }
    //     }
    //   }
    // },
    {
      requestDidStart: () => ({
        willSendResponse: response => {
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
