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
const { getRedisKeycloakCache, saveRedisKeycloakCache } = require('./clients/redisClient');

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
      };

      // get all keycloak groups, do this early to reduce the number of times this is called otherwise
      // but doing this early and once is pretty cheap
      let keycloakGroups = []
      try {
        // check redis for the allgroups cache value
        const data = await getRedisKeycloakCache("allgroups");
        let buff = new Buffer(data, 'base64');
        keycloakGroups = JSON.parse(buff.toString('utf-8'));
      } catch (err) {
        logger.warn(`Couldn't check redis keycloak cache: ${err.message}`);
        // if it can't be recalled from redis, get the data from keycloak
        const allGroups = await Group.Group(modelClients).loadAllGroups();
        keycloakGroups = await Group.Group(modelClients).transformKeycloakGroups(allGroups);
        const data = Buffer.from(JSON.stringify(keycloakGroups)).toString('base64')
        try {
          // then attempt to save it to redis
          await saveRedisKeycloakCache("allgroups", data);
        } catch (err) {
          logger.warn(`Couldn't save redis keycloak cache: ${err.message}`);
        }
      }

      let currentUser = {};
      let serviceAccount = {};
      // if this is a user request, get the users keycloak groups too, do this one to reduce the number of times it is called elsewhere
      // legacy accounts don't do this
      let keycloakUsersGroups = []
      let groupRoleProjectIds = []
      const keycloakGrant = grant
      if (keycloakGrant) {
        keycloakUsersGroups = await User.User(modelClients).getAllGroupsForUser(keycloakGrant.access_token.content.sub);
        serviceAccount = await keycloakGrantManager.obtainFromClientCredentials();
        currentUser = await User.User(modelClients).loadUserById(keycloakGrant.access_token.content.sub);
        // grab the users project ids and roles in the first request
        groupRoleProjectIds = await User.User(modelClients).getAllProjectsIdsForUser(currentUser, keycloakUsersGroups);
      }

      return {
        keycloakAdminClient,
        sqlClientPool,
        hasPermission: grant
          ? keycloakHasPermission(grant, requestCache, modelClients, serviceAccount, currentUser, groupRoleProjectIds)
          : legacyHasPermission(legacyCredentials),
        keycloakGrant,
        requestCache,
        models: {
          UserModel: User.User(modelClients),
          GroupModel: Group.Group(modelClients),
          ProjectModel: ProjectModel.ProjectModel(modelClients),
          EnvironmentModel: EnvironmentModel.EnvironmentModel(modelClients)
        },
        keycloakGroups,
        keycloakUsersGroups,
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

      // get all keycloak groups, do this early to reduce the number of times this is called otherwise
      // but doing this early and once is pretty cheap
      let keycloakGroups = []
      try {
        // check redis for the allgroups cache value
        const data = await getRedisKeycloakCache("allgroups");
        let buff = new Buffer(data, 'base64');
        keycloakGroups = JSON.parse(buff.toString('utf-8'));
      } catch (err) {
        logger.warn(`Couldn't check redis keycloak cache: ${err.message}`);
        // if it can't be recalled from redis, get the data from keycloak
        const allGroups = await Group.Group(modelClients).loadAllGroups();
        keycloakGroups = await Group.Group(modelClients).transformKeycloakGroups(allGroups);
        const data = Buffer.from(JSON.stringify(keycloakGroups)).toString('base64')
        try {
          // then attempt to save it to redis
          await saveRedisKeycloakCache("allgroups", data);
        } catch (err) {
          logger.warn(`Couldn't save redis keycloak cache: ${err.message}`);
        }
      }

      let currentUser = {};
      let serviceAccount = {};
      // if this is a user request, get the users keycloak groups too, do this one to reduce the number of times it is called elsewhere
      // legacy accounts don't do this
      let keycloakUsersGroups = []
      let groupRoleProjectIds = []
      const keycloakGrant = req.kauth ? req.kauth.grant : null
      if (keycloakGrant) {
        keycloakUsersGroups = await User.User(modelClients).getAllGroupsForUser(keycloakGrant.access_token.content.sub);
        serviceAccount = await keycloakGrantManager.obtainFromClientCredentials();
        currentUser = await User.User(modelClients).loadUserById(keycloakGrant.access_token.content.sub);
        // grab the users project ids and roles in the first request
        groupRoleProjectIds = await User.User(modelClients).getAllProjectsIdsForUser(currentUser, keycloakUsersGroups);
      }

      // do a permission check to see if the user is platform admin/owner, or has permission for `viewAll` on certain resources
      // this reduces the number of `viewAll` permission look ups that could potentially occur during subfield resolvers for non admin users
      // every `hasPermission` check adds a delay, and if you're a member of a group that has a lot of projects and environments, hasPermissions is costly when we perform
      // the viewAll permission check, to then error out and follow through with the standard user permission check, effectively costing 2 hasPermission calls for every request
      // this eliminates a huge number of these by making it available in the apollo context
      const hasPermission = req.kauth
          ? keycloakHasPermission(req.kauth.grant, requestCache, modelClients, serviceAccount, currentUser, groupRoleProjectIds)
          : legacyHasPermission(req.legacyCredentials)
      let projectViewAll = false
      let groupViewAll = false
      let environmentViewAll = false
      let deploytargetViewAll = false
      try {
        await hasPermission("project","viewAll")
        projectViewAll = true
      } catch(err) {
        // do nothing
      }
      try {
        await hasPermission("group","viewAll")
        groupViewAll = true
      } catch(err) {
        // do nothing
      }
      try {
        await hasPermission("environment","viewAll")
        environmentViewAll = true
      } catch(err) {
        // do nothing
      }
      try {
        await hasPermission("openshift","viewAll")
        deploytargetViewAll = true
      } catch(err) {
        // do nothing
      }

      return {
        keycloakAdminClient,
        sqlClientPool,
        hasPermission,
        keycloakGrant,
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
        },
        keycloakGroups,
        keycloakUsersGroups,
        adminScopes: {
          projectViewAll: projectViewAll,
          groupViewAll: groupViewAll,
          environmentViewAll: environmentViewAll,
          deploytargetViewAll: deploytargetViewAll,
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
