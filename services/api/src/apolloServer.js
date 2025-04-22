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
const { getKeycloakAdminClient } = require('./clients/keycloak-admin');
const { logger } = require('./loggers/logger');
const { userActivityLogger } = require('./loggers/userActivityLogger');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');
const { keycloakGrantManager } = require('./clients/keycloakClient');

const User = require('./models/user');
const Group = require('./models/group');
const Environment = require('./models/environment');

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
      };

      let currentUser = {};
      let serviceAccount = {};
      // if this is a user request, get the users keycloak groups too, do this one to reduce the number of times it is called elsewhere
      // legacy accounts don't do this
      let keycloakUsersGroups = []
      let groupRoleProjectIds = []
      const keycloakGrant = grant
      let legacyGrant = legacyCredentials ? legacyCredentials : null
      let platformOwner = false
      let platformViewer = false
      if (keycloakGrant) {
        // get all the users keycloak groups, do this early to reduce the number of times this is called otherwise
        keycloakUsersGroups = await User.User(modelClients).getAllGroupsForUser(keycloakGrant.access_token.content.sub);
        serviceAccount = await keycloakGrantManager.obtainFromClientCredentials();
        currentUser = await User.User(modelClients).loadUserById(keycloakGrant.access_token.content.sub);
        const userRoleMapping = await keycloakAdminClient.users.listRealmRoleMappings({id: currentUser.id})
        for (const role of userRoleMapping) {
          if (role.name == "platform-owner") {
            platformOwner = true
          }
          if (role.name == "platform-viewer") {
            platformViewer = true
          }
        }
        // grab the users project ids and roles in the first request
        groupRoleProjectIds = await User.User(modelClients).getAllProjectsIdsForUser(currentUser.id, keycloakUsersGroups);
      }
      if (legacyGrant) {
        const { role } = legacyGrant;
        if (role == 'admin') {
          platformOwner = true
        }
      }

      const hasPermission = grant
        ? keycloakHasPermission(grant, requestCache, modelClients, serviceAccount, currentUser, groupRoleProjectIds)
        : legacyHasPermission(legacyCredentials)

      return {
        keycloakAdminClient,
        sqlClientPool,
        hasPermission,
        keycloakGrant,
        requestCache,
        legacyGrant,
        models: {
          UserModel: User.User(modelClients),
          GroupModel: Group.Group(modelClients),
          EnvironmentModel: Environment.Environment(modelClients)
        },
        keycloakUsersGroups,
        adminScopes: {
          platformOwner: platformOwner,
          platformViewer: platformViewer,
        },
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
      };

      let currentUser = {};
      let serviceAccount = {};
      // if this is a user request, get the users keycloak groups too, do this one to reduce the number of times it is called elsewhere
      // legacy accounts don't do this
      let keycloakUsersGroups = []
      let groupRoleProjectIds = []
      const keycloakGrant = req.kauth ? req.kauth.grant : null
      let legacyGrant = req.legacyCredentials ? req.legacyCredentials : null
      let platformOwner = false
      let platformViewer = false
      if (keycloakGrant) {
        // get all the users keycloak groups, do this early to reduce the number of times this is called otherwise
        keycloakUsersGroups = await User.User(modelClients).getAllGroupsForUser(keycloakGrant.access_token.content.sub);
        serviceAccount = await keycloakGrantManager.obtainFromClientCredentials();
        currentUser = await User.User(modelClients).loadUserById(keycloakGrant.access_token.content.sub);
        const userRoleMapping = await keycloakAdminClient.users.listRealmRoleMappings({id: currentUser.id})
        for (const role of userRoleMapping) {
          if (role.name == "platform-owner") {
            platformOwner = true
          }
          if (role.name == "platform-viewer") {
            platformViewer = true
          }
        }
        // grab the users project ids and roles in the first request
        groupRoleProjectIds = await User.User(modelClients).getAllProjectsIdsForUser(currentUser.id, keycloakUsersGroups);
        await User.User(modelClients).userLastAccessed(currentUser);
      }
      if (legacyGrant) {
        const { role } = legacyGrant;
        if (role == 'admin') {
          platformOwner = true
        }
      }

      const hasPermission = req.kauth
          ? keycloakHasPermission(req.kauth.grant, requestCache, modelClients, serviceAccount, currentUser, groupRoleProjectIds)
          : legacyHasPermission(req.legacyCredentials)

      return {
        keycloakAdminClient,
        sqlClientPool,
        hasPermission,
        keycloakGrant,
        requestCache,
        legacyGrant,
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
          EnvironmentModel: Environment.Environment(modelClients)
        },
        keycloakUsersGroups,
        adminScopes: {
          platformOwner: platformOwner,
          platformViewer: platformViewer,
        },
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
        // operationName would be "getLagoonDemoProjectId" and rootFieldName
        // would be "getProjectByName" with a query like:
        // query getLagoonDemoProjectId { getProjectByName(name: "lagoon-demo") { id } }
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
